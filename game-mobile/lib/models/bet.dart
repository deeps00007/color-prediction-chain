class Bet {
  final int roundId;
  final String color;
  final String amount;

  Bet({required this.roundId, required this.color, required this.amount});

  Map<String, dynamic> toJson() {
    return {'roundId': roundId, 'color': color, 'amount': amount};
  }

  factory Bet.fromJson(Map<String, dynamic> json) {
    return Bet(
      roundId: json['roundId'] as int,
      color: json['color'] as String,
      amount: json['amount'] as String,
    );
  }
}
