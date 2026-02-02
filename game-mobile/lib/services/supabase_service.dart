import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';
import '../models/round.dart';

class SupabaseService {
  static SupabaseService? _instance;
  static SupabaseService get instance => _instance ??= SupabaseService._();

  SupabaseService._();

  SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnonKey,
    );
  }

  // Get current round
  Future<Round?> getCurrentRound() async {
    try {
      final response = await client
          .from('rounds')
          .select()
          .order('id', ascending: false)
          .limit(1)
          .single();

      return Round.fromJson(response);
    } catch (e) {
      print('Error fetching current round: $e');
      return null;
    }
  }

  // Get recent results
  Future<List<String>> getRecentResults({int limit = 10}) async {
    try {
      final response = await client
          .from('round_results_history')
          .select('color')
          .order('id', ascending: false)
          .limit(limit);

      return (response as List)
          .map((item) => (item['color'] as String).toUpperCase())
          .toList();
    } catch (e) {
      print('Error fetching recent results: $e');
      return [];
    }
  }

  // Subscribe to rounds changes
  RealtimeChannel subscribeToRounds(Function(Round) onRoundUpdate) {
    return client
        .channel('rounds-live')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'rounds',
          callback: (payload) {
            onRoundUpdate(Round.fromJson(payload.newRecord));
          },
        )
        .subscribe();
  }

  // Subscribe to results history
  RealtimeChannel subscribeToResults(Function(String) onNewResult) {
    return client
        .channel('history-live')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'round_results_history',
          callback: (payload) {
            final color = (payload.newRecord['color'] as String).toUpperCase();
            onNewResult(color);
          },
        )
        .subscribe();
  }
}
