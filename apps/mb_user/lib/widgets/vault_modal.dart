import 'package:flutter/material.dart';
import '../models/deal_model.dart';
import 'modals/vault_decrypted_sheet.dart';

/// Backward-compatible alias & wrapper around [VaultDecryptedSheet] (Modal 09).
class VaultModal extends StatelessWidget {
  final DealModel deal;
  final UnlockedVaultPayload vaultData;
  final VoidCallback onSettle;
  final VoidCallback onDispute;

  const VaultModal({
    super.key,
    required this.deal,
    required this.vaultData,
    required this.onSettle,
    required this.onDispute,
  });

  static Future<void> show({
    required BuildContext context,
    required DealModel deal,
    required UnlockedVaultPayload vaultData,
    required VoidCallback onSettle,
    required VoidCallback onDispute,
  }) {
    return VaultDecryptedSheet.show(
      context: context,
      deal: deal,
      vaultData: vaultData,
      onSettle: onSettle,
      onDispute: onDispute,
    );
  }

  @override
  Widget build(BuildContext context) {
    return VaultDecryptedSheet(
      deal: deal,
      vaultData: vaultData,
      onSettle: onSettle,
      onDispute: onDispute,
    );
  }
}
