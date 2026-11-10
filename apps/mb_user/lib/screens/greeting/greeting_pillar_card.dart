import 'package:flutter/material.dart';
import '../../theme/app_tokens.dart';

class PillarItem {
  final String title;
  final String subtitle;
  final String desc;
  final IconData iconData;
  final String stepBadge;
  final String metricLeftLabel;
  final String metricLeftValue;
  final String metricRightLabel;
  final String metricRightValue;

  const PillarItem({
    required this.title,
    required this.subtitle,
    required this.desc,
    required this.iconData,
    required this.stepBadge,
    required this.metricLeftLabel,
    required this.metricLeftValue,
    required this.metricRightLabel,
    required this.metricRightValue,
  });
}

class GreetingPillarCard extends StatelessWidget {
  final PillarItem item;
  final int stepIndex;

  const GreetingPillarCard({
    super.key,
    required this.item,
    required this.stepIndex,
  });

  ({Color soft, Color border, Color text}) _stepColors(AppColorPalette c) {
    switch (stepIndex) {
      case 0:
        return (soft: c.emeraldSoft, border: c.emeraldBorder, text: c.emeraldText);
      case 1:
        return (soft: c.cyanSoft, border: c.cyanBorder, text: c.cyanText);
      default:
        return (soft: c.amberSoft, border: c.amberBorder, text: c.amberText);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final accentPalette = _stepColors(c);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AppTokens.cardDecoration(c, radius: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: accentPalette.soft,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: accentPalette.border),
                ),
                child: Icon(
                  item.iconData,
                  color: accentPalette.text,
                  size: 28,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: accentPalette.soft,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: accentPalette.border),
                ),
                child: Text(
                  item.stepBadge,
                  style: AppTokens.monoStyle(
                    color: accentPalette.text,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            item.title,
            style: TextStyle(
              color: c.textPrimary,
              fontSize: 21,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            item.subtitle,
            style: TextStyle(
              color: accentPalette.text,
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            item.desc,
            style: TextStyle(
              color: c.textSecondary,
              fontSize: 13,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 18),
          Divider(height: 1, color: c.border),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RichText(
                text: TextSpan(
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  children: [
                    TextSpan(text: '${item.metricLeftLabel} '),
                    TextSpan(
                      text: item.metricLeftValue,
                      style: TextStyle(
                        color: c.cyanText,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              RichText(
                text: TextSpan(
                  style: AppTokens.monoStyle(
                    color: c.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  children: [
                    TextSpan(text: '${item.metricRightLabel} '),
                    TextSpan(
                      text: item.metricRightValue,
                      style: TextStyle(
                        color: c.emeraldText,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
