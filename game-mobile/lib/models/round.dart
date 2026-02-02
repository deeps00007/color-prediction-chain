class Round {
  final int id;
  final String status;
  final DateTime endTime;
  final String? resultColor;

  Round({
    required this.id,
    required this.status,
    required this.endTime,
    this.resultColor,
  });

  factory Round.fromJson(Map<String, dynamic> json) {
    return Round(
      id: json['id'] as int,
      status: json['status'] as String,
      endTime: DateTime.parse(json['end_time'] as String),
      resultColor: json['result_color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'end_time': endTime.toIso8601String(),
      'result_color': resultColor,
    };
  }
}
