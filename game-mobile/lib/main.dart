import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/supabase_service.dart';
import 'services/contract_service.dart';
import 'providers/wallet_provider.dart';
import 'providers/game_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize services
  await SupabaseService.initialize();
  await ContractService.instance.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()..initialize()),
        ChangeNotifierProvider(create: (_) => GameProvider()..initialize()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            title: 'Color Prediction',
            debugShowCheckedModeBanner: false,
            theme: themeProvider.theme.copyWith(
              textTheme: GoogleFonts.interTextTheme(
                themeProvider.theme.textTheme,
              ),
            ),
            home: const HomeScreen(),
          );
        },
      ),
    );
  }
}
