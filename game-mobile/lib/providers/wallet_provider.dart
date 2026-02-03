import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import '../services/wallet_service.dart';
import '../services/contract_service.dart';
import 'package:web3dart/web3dart.dart';

class WalletProvider with ChangeNotifier {
  final WalletService _walletService = WalletService.instance;
  final ContractService _contractService = ContractService.instance;

  StreamSubscription<String?>? _addressSubscription;

  String? _address;
  String _balance = '0.00';
  bool _isConnecting = false;

  String? get address => _address;
  String get balance => _balance;
  bool get isConnected => _address != null;
  bool get isConnecting => _isConnecting;

  Future<void> initialize() async {
    await _walletService.initialize();

    _addressSubscription ??= _walletService.addressStream.listen((addr) async {
      _address = addr;
      if (_address != null) {
        await updateBalance();
      } else {
        _balance = '0.00';
      }
      notifyListeners();
    });

    _address = _walletService.address;
    if (_address != null) {
      await updateBalance();
    }
    notifyListeners();
  }

  Future<void> refreshFromSession() async {
    await _walletService.refreshFromPersistedSessions();
    _address = _walletService.address;
    if (_address != null) {
      await updateBalance();
    } else {
      _balance = '0.00';
    }
    notifyListeners();
  }

  Future<bool> connect(BuildContext context) async {
    _isConnecting = true;
    notifyListeners();

    try {
      final address = await _walletService.connect();
      if (address != null) {
        _address = address;
        await updateBalance();
        _isConnecting = false;
        notifyListeners();

        // Show success message
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        }
        return true;
      } else {
        // Connection failed - show helpful message
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Connection failed.\n\nMake sure MetaMask Mobile is installed and try again.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 4),
            ),
          );
        }
      }
    } on WalletConnectionException catch (e) {
      debugPrint('Wallet connection exception: $e');
      if (context.mounted) {
        await _showWalletConnectHelpDialog(context, e);
      }
    } catch (e) {
      debugPrint('Error connecting wallet: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('Error: Make sure MetaMask is installed\n${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }

    _isConnecting = false;
    notifyListeners();
    return false;
  }

  Future<void> _showWalletConnectHelpDialog(
    BuildContext context,
    WalletConnectionException exception,
  ) async {
    final wcUri = exception.wcUri?.toString();

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Wallet connection failed'),
          content: Text(
            wcUri == null
                ? exception.message
                : '${exception.message}\n\nYou can copy the WalletConnect link and open it inside MetaMask (or another wallet) to approve.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Close'),
            ),
            if (wcUri != null)
              TextButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: wcUri));
                  if (dialogContext.mounted) {
                    ScaffoldMessenger.of(dialogContext).showSnackBar(
                      const SnackBar(
                        content: Text('WalletConnect link copied'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  }
                },
                child: const Text('Copy link'),
              ),
            FilledButton(
              onPressed: () async {
                await _walletService.reopenLastConnection();
              },
              child: const Text('Try open wallet'),
            ),
          ],
        );
      },
    );
  }

  // Manual address for testing when WalletConnect fails
  void setManualAddress(String address) {
    _address = address;
    updateBalance();
    notifyListeners();
  }

  Future<void> disconnect() async {
    await _walletService.disconnect();
    _address = null;
    _balance = '0.00';
    notifyListeners();
  }

  Future<void> updateBalance() async {
    if (_address == null) return;

    try {
      final balanceBigInt = await _contractService.getBalance(_address!);
      final balanceEther = EtherAmount.fromBigInt(EtherUnit.wei, balanceBigInt);
      _balance =
          balanceEther.getValueInUnit(EtherUnit.ether).toStringAsFixed(2);
      notifyListeners();
    } catch (e) {
      print('Error updating balance: $e');
    }
  }

  Future<String?> sendTransaction({
    required String to,
    required String data,
    String? value,
  }) async {
    return await _walletService.sendTransaction(
      to: to,
      data: data,
      value: value,
    );
  }

  @override
  void dispose() {
    _addressSubscription?.cancel();
    _addressSubscription = null;
    super.dispose();
  }
}
