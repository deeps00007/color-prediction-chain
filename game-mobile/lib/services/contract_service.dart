import 'package:web3dart/web3dart.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../config/contract_abis.dart';

class ContractService {
  static ContractService? _instance;
  static ContractService get instance => _instance ??= ContractService._();

  ContractService._();

  late Web3Client _client;
  late DeployedContract _gameContract;
  late DeployedContract _tokenContract;

  Future<void> initialize() async {
    _client = Web3Client(AppConfig.rpcUrl, http.Client());

    // Load Game Contract
    _gameContract = DeployedContract(
      ContractAbi.fromJson(gameAbi, 'ColorPredictionGame'),
      EthereumAddress.fromHex(AppConfig.gameContractAddress),
    );

    // Load Token Contract
    _tokenContract = DeployedContract(
      ContractAbi.fromJson(tokenAbi, 'ColorGameToken'),
      EthereumAddress.fromHex(AppConfig.tokenContractAddress),
    );
  }

  // Get token balance
  Future<BigInt> getBalance(String address) async {
    try {
      final balanceFunction = _tokenContract.function('balanceOf');
      final result = await _client.call(
        contract: _tokenContract,
        function: balanceFunction,
        params: [EthereumAddress.fromHex(address)],
      );
      return result.first as BigInt;
    } catch (e) {
      print('Error getting balance: $e');
      return BigInt.zero;
    }
  }

  // Get token allowance
  Future<BigInt> getAllowance(String owner, String spender) async {
    try {
      final allowanceFunction = _tokenContract.function('allowance');
      final result = await _client.call(
        contract: _tokenContract,
        function: allowanceFunction,
        params: [
          EthereumAddress.fromHex(owner),
          EthereumAddress.fromHex(spender),
        ],
      );
      return result.first as BigInt;
    } catch (e) {
      print('Error getting allowance: $e');
      return BigInt.zero;
    }
  }

  // Encode approve transaction
  String encodeApprove(BigInt amount) {
    final approveFunction = _tokenContract.function('approve');
    final data = approveFunction.encodeCall([
      EthereumAddress.fromHex(AppConfig.gameContractAddress),
      amount,
    ]);
    return '0x${data.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }

  // Encode place bet transaction
  String encodePlaceBet(int roundId, int color, BigInt amount) {
    final placeBetFunction = _gameContract.function('placeBet');
    final data = placeBetFunction.encodeCall([
      BigInt.from(roundId),
      BigInt.from(color),
      amount,
    ]);
    return '0x${data.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }

  // Encode mint transaction (for testing)
  String encodeMint(String to, BigInt amount) {
    final mintFunction = _tokenContract.function('mint');
    final data = mintFunction.encodeCall([
      EthereumAddress.fromHex(to),
      amount,
    ]);
    return '0x${data.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }

  // Listen to Payout events
  Stream<FilterEvent> listenToPayouts(String address) {
    final event = _gameContract.event('Payout');
    final filter = FilterOptions.events(
      contract: _gameContract,
      event: event,
    );

    return _client.events(filter);
  }

  void dispose() {
    _client.dispose();
  }
}
