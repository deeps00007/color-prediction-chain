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
        final wcUri = uri.toString();

        // Try to open MetaMask app directly
        final metamaskUri =
            Uri.parse('metamask://wc?uri=${Uri.encodeComponent(wcUri)}');

        bool launched = false;
        try {
          launched = await launchUrl(
            metamaskUri,
            mode: LaunchMode.externalApplication,
          );
        } catch (e) {
          // MetaMask not installed, show dialog
        }

        if (!launched && context.mounted) {
          // Show dialog with options
          await _showWalletOptions(context, wcUri);
        }
      }

      // Wait for session approval
      _session = await response.session.future;
      _currentAddress =
          _session!.namespaces['eip155']?.accounts.first.split(':').last;

      return _currentAddress;
    } catch (e) {
      debugPrint('Error connecting wallet: $e');
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
      debugPrint('Error sending transaction: $e');
      rethrow;
    }
  }

  void _onSessionDelete(SessionDelete? args) {
    _session = null;
    _currentAddress = null;
  }

  Future<void> _showWalletOptions(BuildContext context, String wcUri) async {
    return showModalBottomSheet(
      context: context,
      builder: (context) => Container(
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
            const SizedBox(height: 24),

            // MetaMask Button
            ElevatedButton.icon(
              onPressed: () async {
                Navigator.pop(context);
                final metamaskUri = Uri.parse(
                    'metamask://wc?uri=${Uri.encodeComponent(wcUri)}');
                await launchUrl(metamaskUri,
                    mode: LaunchMode.externalApplication);
              },
              icon: const Icon(Icons.account_balance_wallet),
              label: const Text('MetaMask'),
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
                Navigator.pop(context);
                final trustUri =
                    Uri.parse('trust://wc?uri=${Uri.encodeComponent(wcUri)}');
                await launchUrl(trustUri, mode: LaunchMode.externalApplication);
              },
              icon: const Icon(Icons.account_balance_wallet),
              label: const Text('Trust Wallet'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 12),

            // Other Wallets
            OutlinedButton.icon(
              onPressed: () async {
                Navigator.pop(context);
                final uri = Uri.parse(wcUri);
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
              icon: const Icon(Icons.open_in_new),
              label: const Text('Other Wallets'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.all(16),
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Make sure you have a wallet app installed',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
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
