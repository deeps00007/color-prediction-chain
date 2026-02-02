import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:web3dart/web3dart.dart';
import '../models/round.dart';
import '../models/bet.dart';
import '../models/history_item.dart';
import '../services/supabase_service.dart';
import '../services/contract_service.dart';
import '../config/app_config.dart';

class GameProvider with ChangeNotifier {
  final SupabaseService _supabaseService = SupabaseService.instance;
  final ContractService _contractService = ContractService.instance;

  Round? _currentRound;
  int _timeLeft = 0;
  Bet? _activeBet;
  List<HistoryItem> _history = [];
  List<String> _recentResults = [];
  bool _isLoading = true;
  bool _isBetting = false;
  String _bettingStep = '';

  RealtimeChannel? _roundsChannel;
  RealtimeChannel? _resultsChannel;

  // Getters
  Round? get currentRound => _currentRound;
  int get timeLeft => _timeLeft;
  Bet? get activeBet => _activeBet;
  List<HistoryItem> get history => _history;
  List<String> get recentResults => _recentResults;
  bool get isLoading => _isLoading;
  bool get isBetting => _isBetting;
  String get bettingStep => _bettingStep;

  int get wins => _history.where((h) => h.won).length;
  int get totalBets => _history.length;

  Future<void> initialize() async {
    await _loadCurrentRound();
    await _loadRecentResults();
    _subscribeToUpdates();
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _loadCurrentRound() async {
    _currentRound = await _supabaseService.getCurrentRound();
    _updateTimer();
    notifyListeners();
  }

  Future<void> _loadRecentResults() async {
    _recentResults = await _supabaseService.getRecentResults(limit: 10);
    notifyListeners();
  }

  void _subscribeToUpdates() {
    // Subscribe to rounds
    _roundsChannel = _supabaseService.subscribeToRounds((round) {
      // Check if round resolved
      if (_currentRound != null &&
          _currentRound!.status != 'RESOLVED' &&
          round.status == 'RESOLVED') {
        _handleRoundResult(round);
      }
      _currentRound = round;
      _updateTimer();
      notifyListeners();
    });

    // Subscribe to results
    _resultsChannel = _supabaseService.subscribeToResults((color) {
      _recentResults.insert(0, color);
      if (_recentResults.length > 10) {
        _recentResults = _recentResults.sublist(0, 10);
      }
      notifyListeners();
    });
  }

  void _updateTimer() {
    if (_currentRound == null) return;

    final now = DateTime.now();
    final endTime = _currentRound!.endTime;
    final difference = endTime.difference(now).inSeconds;
    _timeLeft = difference > 0 ? difference : 0;
  }

  void updateTimerTick() {
    if (_timeLeft > 0) {
      _timeLeft--;
      notifyListeners();
    }
  }

  Future<bool> placeBet({
    required String walletAddress,
    required String color,
    required String amount,
    required Function(String, String) sendTransaction,
    required Function() updateBalance,
  }) async {
    if (_currentRound == null || _currentRound!.status != 'OPEN') {
      return false;
    }

    _isBetting = true;
    _bettingStep = 'Checking...';
    notifyListeners();

    try {
      final amountWei = EtherAmount.fromUnitAndValue(
        EtherUnit.ether,
        double.parse(amount),
      ).getInWei;

      // Check allowance
      final allowance = await _contractService.getAllowance(
        walletAddress,
        AppConfig.gameContractAddress,
      );

      // Approve if needed
      if (allowance < amountWei) {
        _bettingStep = 'Approving...';
        notifyListeners();

        final approveData = _contractService.encodeApprove(
          BigInt.parse(
              '115792089237316195423570985008687907853269984665640564039457584007913129639935'),
        );

        await sendTransaction(AppConfig.tokenContractAddress, approveData);

        // Wait a bit for approval to be mined
        await Future.delayed(const Duration(seconds: 2));
      }

      // Place bet
      _bettingStep = 'Placing bet...';
      notifyListeners();

      final betData = _contractService.encodePlaceBet(
        _currentRound!.id,
        AppConfig.colorMap[color]!,
        amountWei,
      );

      await sendTransaction(AppConfig.gameContractAddress, betData);

      // Set active bet
      _activeBet = Bet(
        roundId: _currentRound!.id,
        color: color,
        amount: amount,
      );

      // Update balance
      await Future.delayed(const Duration(seconds: 2));
      await updateBalance();

      _isBetting = false;
      _bettingStep = '';
      notifyListeners();
      return true;
    } catch (e) {
      print('Error placing bet: $e');
      _isBetting = false;
      _bettingStep = '';
      notifyListeners();
      return false;
    }
  }

  void _handleRoundResult(Round round) {
    if (_activeBet == null || _activeBet!.roundId != round.id) return;

    final winningColor = round.resultColor?.toUpperCase();
    if (winningColor == null) return;

    final won = _activeBet!.color == winningColor;
    final multiplier = winningColor == 'VIOLET' ? 5 : 2;
    final betAmount = double.parse(_activeBet!.amount);
    final winLoss = won
        ? '+${(betAmount * multiplier).toStringAsFixed(2)}'
        : '-${_activeBet!.amount}';

    final historyItem = HistoryItem(
      roundId: round.id,
      bet: _activeBet!.amount,
      color: _activeBet!.color,
      result: winningColor,
      winLoss: winLoss,
      won: won,
    );

    _history.insert(0, historyItem);
    if (_history.length > 20) {
      _history = _history.sublist(0, 20);
    }

    _activeBet = null;
    notifyListeners();
  }

  void clearHistory() {
    _history.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _roundsChannel?.unsubscribe();
    _resultsChannel?.unsubscribe();
    super.dispose();
  }
}
