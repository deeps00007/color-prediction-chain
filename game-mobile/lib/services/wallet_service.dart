import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:walletconnect_flutter_v2/walletconnect_flutter_v2.dart';

import '../config/app_config.dart';

class WalletConnectionException implements Exception {
  final String message;
  final Uri? wcUri;

  WalletConnectionException(this.message, {this.wcUri});

  @override
  String toString() => message;
}

class WalletService {
  WalletService._();
  static final WalletService instance = WalletService._();

  Web3App? _web3App;
  SessionData? _session;
  String? _address;
  Uri? _lastConnectionUri;

  final StreamController<String?> _addressController =
      StreamController<String?>.broadcast();

  // =======================
  // Getters
  // =======================
  bool get isConnected => _session != null && _address != null;
  String? get address => _address;
  Uri? get lastConnectionUri => _lastConnectionUri;
  Stream<String?> get addressStream => _addressController.stream;

  Future<void> refreshFromPersistedSessions() async {
    await initialize();
    final sessions = _web3App!.sessions.getAll();
    if (sessions.isEmpty) {
      _clearSession();
      return;
    }
    _setSession(sessions.first);
  }

  // =======================
  // INIT
  // =======================
  Future<void> initialize() async {
    if (_web3App != null) return;

    _web3App = await Web3App.createInstance(
      projectId: AppConfig.walletConnectProjectId,
      metadata: const PairingMetadata(
        name: 'Color Prediction',
        description: 'Blockchain betting game',
        url: 'https://colorprediction.app',
        icons: ['https://colorprediction.app/icon.png'],
      ),
    );

    debugPrint('✅ WalletConnect initialized');

    // Restore existing session if available
    final sessions = _web3App!.sessions.getAll();
    if (sessions.isNotEmpty) {
      _setSession(sessions.first);
      debugPrint('♻️ Restored session: $_address');
    }

    // Session listeners
    _web3App!.onSessionConnect.subscribe(_onSessionConnect);
    _web3App!.onSessionDelete.subscribe(_onSessionDelete);
    _web3App!.onSessionUpdate.subscribe(_onSessionUpdate);
  }

  // =======================
  // CONNECT (HYBRID APPROACH)
  // =======================
  Future<String?> connect() async {
    await initialize();

    // If already connected, reuse
    if (_session != null && _address != null) {
      debugPrint('🔁 Already connected: $_address');
      return _address;
    }

    debugPrint('🔌 Starting WalletConnect session');

    // Note: some wallets won't approve a connection if you require a testnet chain
    // they don't have enabled yet. We allow mainnet + Sepolia in the namespace,
    // and can enforce/ask to switch to Sepolia when sending transactions.

    final response = await _web3App!.connect(
      requiredNamespaces: {
        'eip155': RequiredNamespace(
          chains: ['eip155:1', 'eip155:${AppConfig.chainId}'],
          methods: [
            'eth_sendTransaction',
            'wallet_switchEthereumChain',
            'wallet_addEthereumChain',
            'personal_sign',
            'eth_signTypedData',
            'eth_signTypedData_v4',
          ],
          events: ['accountsChanged', 'chainChanged'],
        ),
      },
    );

    // Open wallet (MetaMask / others)
    if (response.uri != null) {
      _lastConnectionUri = response.uri;
      final opened = await _openWalletForSession(response.uri!);
      if (!opened) {
        throw WalletConnectionException(
          'Could not open a wallet app. Install MetaMask (or another WC wallet) and try again.',
          wcUri: response.uri,
        );
      }
    } else {
      throw WalletConnectionException(
        'WalletConnect did not return a connection URI.',
      );
    }

    debugPrint('⏳ Waiting for wallet approval...');

    final session = await _waitForSession(response.session.future);
    if (session == null) {
      throw WalletConnectionException(
        'Wallet approved but no session was received. This is usually a relay/network issue or an invalid WalletConnect Project ID.',
        wcUri: _lastConnectionUri,
      );
    }

    _setSession(session);
    if (_address == null) {
      throw WalletConnectionException(
        'Session established but no account address was returned by the wallet.',
        wcUri: _lastConnectionUri,
      );
    }

    debugPrint('✅ Wallet connected: $_address');
    return _address;
  }

  Future<SessionData?> _waitForSession(
      Future<SessionData> sessionFuture) async {
    const totalTimeout = Duration(seconds: 120);

    // Important: don't use Future.any() with null-returning futures.
    // If one path returns null early (e.g. response.session.future throws),
    // Future.any would finish immediately even though the session might arrive
    // via event/polling.

    final sessionCompleter = Completer<SessionData>();

    // 1) Future from connect()
    sessionFuture.then((s) {
      debugPrint('✅ Session received via response.session.future');
      if (!sessionCompleter.isCompleted) sessionCompleter.complete(s);
    }).catchError((e) {
      debugPrint('⚠️ response.session.future error: $e');
    });

    // 2) Event path
    void handler(SessionConnect? event) {
      final session = event?.session;
      if (session != null && !sessionCompleter.isCompleted) {
        debugPrint('✅ Session received via onSessionConnect event');
        sessionCompleter.complete(session);
      }
    }

    _web3App!.onSessionConnect.subscribe(handler);

    // 3) Polling path (last resort)
    () async {
      for (var i = 1; i <= totalTimeout.inSeconds; i++) {
        if (sessionCompleter.isCompleted) return;
        await Future.delayed(const Duration(seconds: 1));
        final sessions = _web3App!.sessions.getAll();
        if (sessions.isNotEmpty && !sessionCompleter.isCompleted) {
          debugPrint('✅ Session received via polling (after ${i}s)');
          sessionCompleter.complete(sessions.first);
          return;
        }
        if (i % 10 == 0) {
          debugPrint('⏳ Still waiting for session... (${i}s)');
        }
      }
    }();

    try {
      return await sessionCompleter.future.timeout(totalTimeout);
    } catch (_) {
      return null;
    } finally {
      _web3App!.onSessionConnect.unsubscribe(handler);
    }
  }

  Future<bool> _openWalletForSession(Uri wcUri) async {
    final encoded = Uri.encodeComponent(wcUri.toString());

    // MetaMask universal link (most reliable on mobile)
    final metamaskUniversal =
        Uri.parse('https://metamask.app.link/wc?uri=$encoded');

    // MetaMask custom scheme
    final metamaskScheme = Uri.parse('metamask://wc?uri=$encoded');

    // WalletConnect universal link (opens wallet selector)
    final walletConnectUniversal =
        Uri.parse('https://walletconnect.com/wc?uri=$encoded');

    final candidates = <Uri>[
      metamaskUniversal,
      metamaskScheme,
      walletConnectUniversal,
      wcUri,
    ];

    for (final uri in candidates) {
      try {
        final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
        debugPrint('🔗 launchUrl($uri) => $ok');
        if (ok) return true;
      } catch (e) {
        debugPrint('⚠️ launchUrl failed for $uri: $e');
      }
    }

    debugPrint('❌ Could not open any wallet link');
    return false;
  }

  Future<bool> reopenLastConnection() async {
    final uri = _lastConnectionUri;
    if (uri == null) return false;
    return _openWalletForSession(uri);
  }

  // =======================
  // DISCONNECT
  // =======================
  Future<void> disconnect() async {
    if (_session == null || _web3App == null) return;

    await _web3App!.disconnectSession(
      topic: _session!.topic,
      reason: Errors.getSdkError(Errors.USER_DISCONNECTED),
    );

    _clearSession();
    debugPrint('🔌 Wallet disconnected');
  }

  // =======================
  // SEND TRANSACTION
  // =======================
  Future<String> sendTransaction({
    required String to,
    String? data,
    String? value,
  }) async {
    if (!isConnected) {
      throw Exception('Wallet not connected');
    }

    final result = await _web3App!.request(
      topic: _session!.topic,
      chainId: 'eip155:${AppConfig.chainId}',
      request: SessionRequestParams(
        method: 'eth_sendTransaction',
        params: [
          {
            'from': _address,
            'to': to,
            if (data != null) 'data': data,
            if (value != null) 'value': value,
          }
        ],
      ),
    );

    debugPrint('📤 Transaction hash: $result');
    return result as String;
  }

  // =======================
  // INTERNAL HELPERS
  // =======================
  void _setSession(SessionData session) {
    _session = session;
    final eip155 = session.namespaces['eip155'];
    final account =
        eip155?.accounts.isNotEmpty == true ? eip155!.accounts.first : null;
    _address = account?.split(':').last;
    debugPrint('👤 Wallet account: $_address');
    _addressController.add(_address);
  }

  void _clearSession() {
    _session = null;
    _address = null;
    _addressController.add(null);
  }

  // =======================
  // SESSION EVENTS
  // =======================
  void _onSessionConnect(SessionConnect? event) {
    if (event?.session != null) {
      _setSession(event!.session);
      debugPrint('🔗 Session connected (event): $_address');
    }
  }

  void _onSessionDelete(SessionDelete? event) {
    debugPrint('❌ Session deleted');
    _clearSession();
  }

  void _onSessionUpdate(SessionUpdate? event) {
    debugPrint('🔄 Session updated');
  }

  // =======================
  // CLEANUP
  // =======================
  void dispose() {
    _web3App?.onSessionConnect.unsubscribe(_onSessionConnect);
    _web3App?.onSessionDelete.unsubscribe(_onSessionDelete);
    _web3App?.onSessionUpdate.unsubscribe(_onSessionUpdate);
    _addressController.close();
  }
}
