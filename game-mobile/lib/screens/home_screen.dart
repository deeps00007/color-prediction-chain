import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.indigo, Colors.purple],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'CP',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Color Prediction',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Round #${gameProvider.currentRound?.id ?? '---'}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Theme toggle
          IconButton(
            onPressed: themeProvider.toggleTheme,
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: gameProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Wallet Section
                  _buildWalletSection(walletProvider, isDark),
                  const SizedBox(height: 16),

                  // Game Section
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Left Column - Timer & Results
                      Expanded(
                        flex: 3,
                        child: Column(
                          children: [
                            _buildTimerCard(gameProvider, isDark),
                            const SizedBox(height: 16),
                            _buildRecentResults(gameProvider, isDark),
                            if (gameProvider.activeBet != null) ...[
                              const SizedBox(height: 16),
                              _buildActiveBet(gameProvider, isDark),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Right Column - Betting & History
                      Expanded(
                        flex: 5,
                        child: Column(
                          children: [
                            _buildBettingPanel(
                                walletProvider, gameProvider, isDark),
                            const SizedBox(height: 16),
                            _buildHistory(gameProvider, isDark),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildWalletSection(WalletProvider walletProvider, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: walletProvider.isConnected
            ? Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Balance',
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
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () async {
                      // Mint tokens
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Get Test Tokens'),
                          content: const Text('Mint 1000 CGT test tokens?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                            FilledButton(
                              onPressed: () async {
                                Navigator.pop(context);
                                // TODO: Implement mint
                              },
                              child: const Text('Mint'),
                            ),
                          ],
                        ),
                      );
                    },
                    child: const Text('Get Tokens'),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color:
                          isDark ? Colors.grey.shade700 : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isDark
                            ? Colors.grey.shade600
                            : Colors.grey.shade300,
                      ),
                    ),
                    child: Text(
                      '${walletProvider.address!.substring(0, 6)}...${walletProvider.address!.substring(walletProvider.address!.length - 4)}',
                      style: const TextStyle(
                          fontFamily: 'monospace', fontSize: 12),
                    ),
                  ),
                ],
              )
            : FilledButton.icon(
                onPressed: walletProvider.isConnecting
                    ? null
                    : () => walletProvider.connect(context),
                icon: const Icon(Icons.account_balance_wallet),
                label: Text(walletProvider.isConnecting
                    ? 'Connecting...'
                    : 'Connect Wallet'),
              ),
      ),
    );
  }

  Widget _buildTimerCard(GameProvider gameProvider, bool isDark) {
    final timeLeft = gameProvider.timeLeft;
    final isUrgent = timeLeft <= 5;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Time Remaining',
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$timeLeft',
              style: TextStyle(
                fontSize: 56,
                fontWeight: FontWeight.bold,
                color: isUrgent ? Colors.red : null,
              ),
            ),
            Text(
              'seconds',
              style: TextStyle(
                fontSize: 16,
                color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                border: Border.all(color: Colors.green.withOpacity(0.3)),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recent Results',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: gameProvider.recentResults.map((color) {
                return Container(
                  width: 36,
                  height: 36,
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
                        fontSize: 12,
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Active Bet',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue),
            ),
            const SizedBox(height: 8),
            Text(
              '${bet.amount} CGT on ${bet.color}',
              style: const TextStyle(color: Colors.blue),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBettingPanel(
      WalletProvider walletProvider, GameProvider gameProvider, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Place Your Bet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Color Selection
            const Text('Select Color',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildColorButton('RED', AppConfig.redColor, isDark),
                const SizedBox(width: 8),
                _buildColorButton('GREEN', AppConfig.greenColor, isDark),
                const SizedBox(width: 8),
                _buildColorButton('VIOLET', AppConfig.violetColor, isDark),
              ],
            ),
            const SizedBox(height: 16),

            // Amount Input
            const Text('Bet Amount',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter amount',
                suffix: Text('CGT',
                    style: TextStyle(
                        color: isDark
                            ? Colors.grey.shade400
                            : Colors.grey.shade600)),
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: ['10', '50', '100', '500'].map((val) {
                return ChoiceChip(
                  label: Text(val),
                  selected: _amountController.text == val,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _amountController.text = val);
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Place Bet Button
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: (!walletProvider.isConnected ||
                        _selectedColor == null ||
                        gameProvider.isBetting)
                    ? null
                    : () => _placeBet(walletProvider, gameProvider),
                child: gameProvider.isBetting
                    ? Text(gameProvider.bettingStep)
                    : const Text('Place Bet'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildColorButton(String color, Color bgColor, bool isDark) {
    final isSelected = _selectedColor == color;
    final multiplier = color == 'VIOLET' ? '5x' : '2x';

    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedColor = color),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(8),
            border:
                isSelected ? Border.all(color: Colors.white, width: 3) : null,
          ),
          child: Column(
            children: [
              Text(
                color,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
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
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                if (gameProvider.history.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Clear History'),
                          content: const Text('Are you sure?'),
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
                    child: const Text('Clear', style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (gameProvider.history.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child:
                      Text('No bets yet', style: TextStyle(color: Colors.grey)),
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
                      color: item.won
                          ? Colors.green.withOpacity(0.3)
                          : Colors.red.withOpacity(0.3),
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Round #${item.roundId}',
                            style: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            'Bet: ${item.bet} CGT on ${item.color}',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ],
                      ),
                      Text(
                        '${item.winLoss} CGT',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
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
