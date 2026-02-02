class HistoryItem {
  final int roundId;
  final String bet;
  final String color;
  final String result;
  final String winLoss;
  final bool won;

  HistoryItem({
    required this.roundId,
    required this.bet,
    required this.color,
    required this.result,
    required this.winLoss,
    required this.won,
  });

  Map<String, dynamic> toJson() {
    return {
      'roundId': roundId,
      'bet': bet,
      'color': color,
      'result': result,
      'winLoss': winLoss,
      'won': won,
    };
  }

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    return HistoryItem(
      roundId: json['roundId'] as int,
      bet: json['bet'] as String,
      color: json['color'] as String,
      result: json['result'] as String,
      winLoss: json['winLoss'] as String,
      won: json['won'] as bool,
    );
  }
}
