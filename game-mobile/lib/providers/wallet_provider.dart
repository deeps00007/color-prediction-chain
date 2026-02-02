import 'package:flutter/material.dart';
import '../services/wallet_service.dart';
import '../services/contract_service.dart';
import 'package:web3dart/web3dart.dart';

class WalletProvider with ChangeNotifier {
  final WalletService _walletService = WalletService.instance;
  final ContractService _contractService = ContractService.instance;

  String? _address;
  String _balance = '0.00';
  bool _isConnecting = false;

  String? get address => _address;
  String get balance => _balance;
  bool get isConnected => _address != null;
  bool get isConnecting => _isConnecting;

  Future<void> initialize() async {
    await _walletService.initialize();
    _address = _walletService.address;
    if (_address != null) {
      await updateBalance();
    }
    notifyListeners();
  }

  Future<bool> connect(BuildContext context) async {
    _isConnecting = true;
    notifyListeners();

    try {
      final address = await _walletService.connect(context);
      if (address != null) {
        _address = address;
        await updateBalance();
        _isConnecting = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Error connecting wallet: $e');
    }

    _isConnecting = false;
    notifyListeners();
    return false;
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
}
