import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/wallet_provider.dart';
import '../providers/game_provider.dart';
import '../providers/theme_provider.dart';
import '../config/app_config.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Timer? _timer;
  String? _selectedColor;
  final TextEditingController _amountController =
      TextEditingController(text: '10');

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      context.read<GameProvider>().updateTimerTick();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final walletProvider = context.watch<WalletProvider>();
    final gameProvider = context.watch<GameProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Color Prediction',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            onPressed: themeProvider.toggleTheme,
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
          ),
        ],
      ),
      body: gameProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Wallet Card
                    _buildWalletCard(walletProvider, isDark),
                    const SizedBox(height: 16),

                    // Round Info & Timer
                    _buildRoundCard(gameProvider, isDark),
                    const SizedBox(height: 16),

                    // Recent Results
                    _buildRecentResults(gameProvider, isDark),
                    const SizedBox(height: 16),

                    // Active Bet
                    if (gameProvider.activeBet != null) ...[
                      _buildActiveBet(gameProvider, isDark),
                      const SizedBox(height: 16),
                    ],

                    // Betting Panel
                    _buildBettingPanel(walletProvider, gameProvider, isDark),
                    const SizedBox(height: 16),

                    // History
                    _buildHistory(gameProvider, isDark),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildWalletCard(WalletProvider walletProvider, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: walletProvider.isConnected
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Balance',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? Colors.grey.shade400
                                  : Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${walletProvider.balance} CGT',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () => walletProvider.updateBalance(),
                        icon: const Icon(Icons.refresh),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color:
                          isDark ? Colors.grey.shade800 : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.account_balance_wallet, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '${walletProvider.address!.substring(0, 6)}...${walletProvider.address!.substring(walletProvider.address!.length - 4)}',
                          style: const TextStyle(fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: walletProvider.isConnecting
                      ? null
                      : () => walletProvider.connect(context),
                  icon: const Icon(Icons.account_balance_wallet),
                  label: Text(walletProvider.isConnecting
                      ? 'Connecting...'
                      : 'Connect Wallet'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildRoundCard(GameProvider gameProvider, bool isDark) {
    final timeLeft = gameProvider.timeLeft;
    final isUrgent = timeLeft <= 5;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              'Round #${gameProvider.currentRound?.id ?? '---'}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '$timeLeft',
              style: TextStyle(
                fontSize: 72,
                fontWeight: FontWeight.bold,
                color: isUrgent
                    ? Colors.red
                    : (isDark ? Colors.white : Colors.black),
                height: 1,
              ),
            ),
            Text(
              'seconds',
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                border: Border.all(color: Colors.green),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    gameProvider.currentRound?.status ?? 'LOADING',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentResults(GameProvider gameProvider, bool isDark) {
    if (gameProvider.recentResults.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recent Results',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: gameProvider.recentResults.map((color) {
                return Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getColorFromString(color),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      color[0],
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveBet(GameProvider gameProvider, bool isDark) {
    final bet = gameProvider.activeBet!;
    return Card(
      color: Colors.blue.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.blue),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Active Bet',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  Text(
                    '${bet.amount} CGT on ${bet.color}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBettingPanel(
      WalletProvider walletProvider, GameProvider gameProvider, bool isDark) {
    final canBet = walletProvider.isConnected &&
        gameProvider.currentRound?.status == 'OPEN' &&
        !gameProvider.isBetting;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Place Your Bet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Color Selection
            Row(
              children: [
                Expanded(child: _buildColorButton('RED', AppConfig.redColor)),
                const SizedBox(width: 8),
                Expanded(
                    child: _buildColorButton('GREEN', AppConfig.greenColor)),
                const SizedBox(width: 8),
                Expanded(
                    child: _buildColorButton('VIOLET', AppConfig.violetColor)),
              ],
            ),
            const SizedBox(height: 16),

            // Amount Input
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Bet Amount',
                suffixText: 'CGT',
                border: const OutlineInputBorder(),
                enabled: canBet,
              ),
            ),
            const SizedBox(height: 12),

            // Quick Amount Buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['10', '50', '100', '500'].map((val) {
                return ChoiceChip(
                  label: Text('$val CGT'),
                  selected: _amountController.text == val,
                  onSelected: canBet
                      ? (selected) {
                          if (selected) {
                            setState(() => _amountController.text = val);
                          }
                        }
                      : null,
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Place Bet Button
            SizedBox(
              height: 50,
              child: FilledButton(
                onPressed: (canBet && _selectedColor != null)
                    ? () => _placeBet(walletProvider, gameProvider)
                    : null,
                child: gameProvider.isBetting
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(gameProvider.bettingStep),
                        ],
                      )
                    : const Text('Place Bet', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildColorButton(String color, Color bgColor) {
    final isSelected = _selectedColor == color;
    final multiplier = color == 'VIOLET' ? '5x' : '2x';

    return InkWell(
      onTap: () => setState(() => _selectedColor = color),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: isSelected ? Border.all(color: Colors.white, width: 3) : null,
          boxShadow: isSelected
              ? [
                  BoxShadow(
                      color: bgColor.withOpacity(0.5),
                      blurRadius: 8,
                      spreadRadius: 2)
                ]
              : null,
        ),
        child: Column(
          children: [
            Text(
              color,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              multiplier,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistory(GameProvider gameProvider, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Betting History',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                if (gameProvider.history.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Clear History'),
                          content: const Text('Clear all betting history?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            FilledButton(
                              onPressed: () {
                                gameProvider.clearHistory();
                                Navigator.pop(context);
                              },
                              child: const Text('Clear'),
                            ),
                          ],
                        ),
                      );
                    },
                    child: const Text('Clear'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (gameProvider.history.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: Text(
                    'No bets yet',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ...gameProvider.history.take(10).map((item) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: item.won
                        ? Colors.green.withOpacity(0.1)
                        : Colors.red.withOpacity(0.1),
                    border: Border.all(
                      color: item.won ? Colors.green : Colors.red,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        item.won ? Icons.check_circle : Icons.cancel,
                        color: item.won ? Colors.green : Colors.red,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Round #${item.roundId}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${item.bet} CGT on ${item.color}',
                              style: const TextStyle(fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${item.winLoss} CGT',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: item.won ? Colors.green : Colors.red,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
          ],
        ),
      ),
    );
  }

  Color _getColorFromString(String color) {
    switch (color) {
      case 'RED':
        return AppConfig.redColor;
      case 'GREEN':
        return AppConfig.greenColor;
      case 'VIOLET':
        return AppConfig.violetColor;
      default:
        return Colors.grey;
    }
  }

  Future<void> _placeBet(
      WalletProvider walletProvider, GameProvider gameProvider) async {
    final success = await gameProvider.placeBet(
      walletAddress: walletProvider.address!,
      color: _selectedColor!,
      amount: _amountController.text,
      sendTransaction: (to, data) =>
          walletProvider.sendTransaction(to: to, data: data),
      updateBalance: () => walletProvider.updateBalance(),
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              success ? 'Bet placed successfully!' : 'Failed to place bet'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );

      if (success) {
        setState(() => _selectedColor = null);
      }
    }
  }
}
