import 'package:walletconnect_flutter_v2/walletconnect_flutter_v2.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_config.dart';

class WalletService {
  static WalletService? _instance;
  static WalletService get instance => _instance ??= WalletService._();

  WalletService._();

  Web3App? _web3App;
  SessionData? _session;
  String? _currentAddress;

  bool get isConnected => _session != null && _currentAddress != null;
  String? get address => _currentAddress;

  Future<void> initialize() async {
    try {
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

      // Check for existing sessions
      _checkExistingSessions();

      // Listen to session events
      _web3App!.onSessionDelete.subscribe(_onSessionDelete);
      _web3App!.onSessionConnect.subscribe(_onSessionConnect);
      _web3App!.onSessionUpdate.subscribe(_onSessionUpdate);
    } catch (e) {
      debugPrint('❌ Error initializing WalletConnect: $e');
    }
  }

  void _checkExistingSessions() {
    final sessions = _web3App!.sessions.getAll();
    if (sessions.isNotEmpty) {
      _session = sessions.first;
      _currentAddress =
          _session!.namespaces['eip155']?.accounts.first.split(':').last;
      debugPrint('✅ Found existing session: $_currentAddress');
    }
  }

  Future<String?> connect(BuildContext context) async {
    if (_web3App == null) {
      await initialize();
    }

    // Clear any existing sessions first
    try {
      final existingSessions = _web3App!.sessions.getAll();
      if (existingSessions.isNotEmpty) {
        debugPrint('🧹 Clearing ${existingSessions.length} old session(s)...');
        for (var session in existingSessions) {
          await _web3App!.disconnectSession(
            topic: session.topic,
            reason: Errors.getSdkError(Errors.USER_DISCONNECTED),
          );
        }
        _session = null;
        _currentAddress = null;
        await Future.delayed(const Duration(milliseconds: 500));
      }
    } catch (e) {
      debugPrint('⚠️ Error clearing sessions: $e');
    }

    debugPrint('🔄 Starting fresh connection...');

    try {
      final ConnectResponse response = await _web3App!.connect(
        requiredNamespaces: {
          'eip155': RequiredNamespace(
            chains: ['eip155:${AppConfig.chainId}'],
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
            ],
            events: ['chainChanged', 'accountsChanged'],
          ),
        },
      );

      final Uri? uri = response.uri;
      if (uri != null) {
        final wcUri = uri.toString();
        debugPrint('📱 WalletConnect URI generated');

        // Try to open MetaMask app
        final metamaskUri =
            Uri.parse('metamask://wc?uri=${Uri.encodeComponent(wcUri)}');

        try {
          final launched = await launchUrl(
            metamaskUri,
            mode: LaunchMode.externalApplication,
          );
          debugPrint(
              launched ? '✅ Opened MetaMask' : '❌ Failed to open MetaMask');

          if (!launched && context.mounted) {
            await _showWalletOptions(context, wcUri);
          }
        } catch (e) {
          debugPrint('❌ Error launching MetaMask: $e');
          if (context.mounted) {
            await _showWalletOptions(context, wcUri);
          }
        }
      }

      debugPrint('⏳ Waiting for approval (polling for session)...');

      // Instead of waiting for future, poll for session
      int attempts = 0;
      const maxAttempts = 60; // 60 seconds

      while (attempts < maxAttempts) {
        await Future.delayed(const Duration(seconds: 1));

        // Check if session was created
        final sessions = _web3App!.sessions.getAll();
        if (sessions.isNotEmpty) {
          _session = sessions.first;
          _currentAddress =
              _session!.namespaces['eip155']?.accounts.first.split(':').last;
          debugPrint('✅ Connected! Address: $_currentAddress');
          return _currentAddress;
        }

        attempts++;
        if (attempts % 5 == 0) {
          debugPrint('⏳ Still waiting... ($attempts seconds)');
        }
      }

      debugPrint('⏱️ Connection timeout after $maxAttempts seconds');
      return null;
    } catch (e) {
      debugPrint('❌ Connection error: $e');
      return null;
    }
  }

  Future<void> disconnect() async {
    if (_session != null && _web3App != null) {
      try {
        await _web3App!.disconnectSession(
          topic: _session!.topic,
          reason: Errors.getSdkError(Errors.USER_DISCONNECTED),
        );
        debugPrint('✅ Disconnected');
      } catch (e) {
        debugPrint('❌ Disconnect error: $e');
      }
      _session = null;
      _currentAddress = null;
    }
  }

  Future<String?> sendTransaction({
    required String to,
    required String data,
    String? value,
  }) async {
    if (_session == null || _currentAddress == null || _web3App == null) {
      throw Exception('Wallet not connected');
    }

    debugPrint('📤 Sending transaction to $to');

    try {
      final result = await _web3App!.request(
        topic: _session!.topic,
        chainId: 'eip155:${AppConfig.chainId}',
        request: SessionRequestParams(
          method: 'eth_sendTransaction',
          params: [
            {
              'from': _currentAddress,
              'to': to,
              'data': data,
              if (value != null) 'value': value,
            }
          ],
        ),
      );

      debugPrint('✅ Transaction sent: $result');
      return result as String;
    } catch (e) {
      debugPrint('❌ Transaction error: $e');
      rethrow;
    }
  }

  void _onSessionDelete(SessionDelete? args) {
    debugPrint('🔌 Session deleted');
    _session = null;
    _currentAddress = null;
  }

  void _onSessionConnect(SessionConnect? args) {
    debugPrint('🔗 Session connected event: ${args?.session.topic}');
    if (args?.session != null) {
      _session = args!.session;
      _currentAddress =
          _session!.namespaces['eip155']?.accounts.first.split(':').last;
      debugPrint('✅ Session set from event: $_currentAddress');
    }
  }

  void _onSessionUpdate(SessionUpdate? args) {
    debugPrint('🔄 Session updated: ${args?.topic}');
  }

  Future<void> _showWalletOptions(BuildContext context, String wcUri) async {
    return showModalBottomSheet(
      context: context,
      isDismissible: false,
      builder: (context) => WillPopScope(
        onWillPop: () async => false,
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Connect Wallet',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Tap to open your wallet app',
                style: TextStyle(color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // MetaMask Button
              ElevatedButton.icon(
                onPressed: () async {
                  final metamaskUri = Uri.parse(
                      'metamask://wc?uri=${Uri.encodeComponent(wcUri)}');
                  await launchUrl(metamaskUri,
                      mode: LaunchMode.externalApplication);
                },
                icon: const Icon(Icons.account_balance_wallet),
                label: const Text('Open MetaMask'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 12),

              // Trust Wallet Button
              ElevatedButton.icon(
                onPressed: () async {
                  final trustUri =
                      Uri.parse('trust://wc?uri=${Uri.encodeComponent(wcUri)}');
                  await launchUrl(trustUri,
                      mode: LaunchMode.externalApplication);
                },
                icon: const Icon(Icons.account_balance_wallet),
                label: const Text('Open Trust Wallet'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 24),

              OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              const SizedBox(height: 12),

              const Text(
                '1. Tap button to open wallet\n2. Approve the connection\n3. Return to this app',
                style: TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void dispose() {
    _web3App?.onSessionDelete.unsubscribe(_onSessionDelete);
    _web3App?.onSessionConnect.unsubscribe(_onSessionConnect);
    _web3App?.onSessionUpdate.unsubscribe(_onSessionUpdate);
  }
}
