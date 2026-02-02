import 'package:flutter/material.dart';

class AppConfig {
  // WalletConnect
  static const String walletConnectProjectId = '457f82e62af515ad9c6aab0c03028941';
  
  // Supabase
  static const String supabaseUrl = 'https://zskfvqfszulwuhshzuxa.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U';
  
  // Smart Contracts
  static const String gameContractAddress = '0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6';
  static const String tokenContractAddress = '0xfDf4343D02330530cC4E3239C5f3F754a767fe7A';
  
  // Network
  static const String networkName = 'Sepolia Testnet';
  static const int chainId = 11155111; // Sepolia
  static const String rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
  
  // Color Map
  static const Map<String, int> colorMap = {
    'RED': 0,
    'GREEN': 1,
    'VIOLET': 2,
  };
  
  // Color Values
  static const Color redColor = Color(0xFFEF4444);
  static const Color greenColor = Color(0xFF10B981);
  static const Color violetColor = Color(0xFF8B5CF6);
}
