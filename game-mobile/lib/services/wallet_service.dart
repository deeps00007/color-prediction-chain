import 'package:walletconnect_flutter_v2/walletconnect_flutter_v2.dart';
import 'package:flutter/material.dart';
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
    _web3App = await Web3App.createInstance(
      projectId: AppConfig.walletConnectProjectId,
      metadata: const PairingMetadata(
        name: 'Color Prediction',
        description: 'Blockchain betting game',
        url: 'https://colorprediction.app',
        icons: ['https://colorprediction.app/icon.png'],
      ),
    );

    // Check for existing sessions
    final sessions = _web3App!.sessions.getAll();
    if (sessions.isNotEmpty) {
      _session = sessions.first;
      _currentAddress =
          _session!.namespaces['eip155']?.accounts.first.split(':').last;
    }

    // Listen to session events
    _web3App!.onSessionDelete.subscribe(_onSessionDelete);
  }

  Future<String?> connect(BuildContext context) async {
    if (_web3App == null) {
      await initialize();
    }

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
        // Show QR code or deep link
        // For mobile, we'll use deep linking
        final wcUri = uri.toString();

        // Try to open MetaMask app
        final metamaskUri = 'metamask://wc?uri=${Uri.encodeComponent(wcUri)}';

        // You can also show a dialog with the URI for other wallets
        if (context.mounted) {
          _showConnectionDialog(context, wcUri);
        }
      }

      // Wait for session approval
      _session = await response.session.future;
      _currentAddress =
          _session!.namespaces['eip155']?.accounts.first.split(':').last;

      return _currentAddress;
    } catch (e) {
      print('Error connecting wallet: $e');
      return null;
    }
  }

  Future<void> disconnect() async {
    if (_session != null && _web3App != null) {
      await _web3App!.disconnectSession(
        topic: _session!.topic,
        reason: Errors.getSdkError(Errors.USER_DISCONNECTED),
      );
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

      return result as String;
    } catch (e) {
      print('Error sending transaction: $e');
      rethrow;
    }
  }

  void _onSessionDelete(SessionDelete? args) {
    _session = null;
    _currentAddress = null;
  }

  void _showConnectionDialog(BuildContext context, String wcUri) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Connect Wallet'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Open your wallet app to connect'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // Copy URI to clipboard or open wallet
                Navigator.pop(context);
              },
              child: const Text('Open MetaMask'),
            ),
          ],
        ),
      ),
    );
  }

  void dispose() {
    _web3App?.onSessionDelete.unsubscribe(_onSessionDelete);
  }
}
