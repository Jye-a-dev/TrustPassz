import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../theme/app_tokens.dart';

enum ServerHealthState { checking, online, degraded, offline }

/// Non-blocking, real-time backend health check and network latency badge.
/// Dual-theme compliant with mandatory border and >= 44x44px touch target.
class ServerStatusBar extends StatefulWidget {
  final Duration checkInterval;
  final Duration latencyThreshold;
  final String healthEndpoint;

  const ServerStatusBar({
    super.key,
    this.checkInterval = const Duration(seconds: 30),
    this.latencyThreshold = const Duration(milliseconds: 500),
    this.healthEndpoint = '/api/v1/health',
  });

  @override
  State<ServerStatusBar> createState() => _ServerStatusBarState();
}

class _ServerStatusBarState extends State<ServerStatusBar> {
  ServerHealthState _state = ServerHealthState.checking;
  int? _latencyMs;
  Timer? _periodicTimer;

  @override
  void initState() {
    super.initState();
    _executeHealthCheck();
    _periodicTimer = Timer.periodic(widget.checkInterval, (_) {
      _executeHealthCheck();
    });
  }

  @override
  void dispose() {
    _periodicTimer?.cancel();
    super.dispose();
  }

  Future<void> _executeHealthCheck() async {
    if (!mounted) return;
    setState(() {
      _state = ServerHealthState.checking;
    });

    try {
      final latency = await ApiClient.instance.checkHealthLatency(
        endpoint: widget.healthEndpoint,
        timeout: widget.latencyThreshold,
      );

      if (!mounted) return;
      setState(() {
        _latencyMs = latency;
        _state = latency < widget.latencyThreshold.inMilliseconds
            ? ServerHealthState.online
            : ServerHealthState.degraded;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _state = ServerHealthState.offline;
        _latencyMs = null;
      });
    }
  }

  Color _getStatusColor(AppColorPalette c) {
    switch (_state) {
      case ServerHealthState.online:
        return c.emeraldText;
      case ServerHealthState.degraded:
        return c.amberText;
      case ServerHealthState.offline:
        return c.roseText;
      case ServerHealthState.checking:
        return c.cyanText;
    }
  }

  String _getStatusText() {
    switch (_state) {
      case ServerHealthState.online:
        return _latencyMs != null
            ? 'Backend Online (${_latencyMs}ms)'
            : 'Backend Online';
      case ServerHealthState.degraded:
        return 'Backend Slow (${_latencyMs}ms)';
      case ServerHealthState.offline:
        return 'Backend Offline';
      case ServerHealthState.checking:
        return 'Kiểm tra máy chủ...';
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.tp;
    final statusColor = _getStatusColor(c);
    final statusText = _getStatusText();

    return Container(
      padding: const EdgeInsets.only(left: 12, right: 4, top: 2, bottom: 2),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.border, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: statusColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            statusText,
            style: AppTokens.monoStyle(
              color: statusColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 4),
          SizedBox(
            width: 44,
            height: 44,
            child: IconButton(
              iconSize: 16,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
              icon: Icon(Icons.refresh_rounded, color: statusColor),
              tooltip: 'Kiểm tra lại kết nối backend',
              onPressed:
                  _state == ServerHealthState.checking ? null : _executeHealthCheck,
            ),
          ),
        ],
      ),
    );
  }
}
