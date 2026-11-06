import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/api_client.dart';

enum ServerHealthState { checking, online, degraded, offline }

/// Non-blocking, real-time backend health check and network latency badge.
/// Complies with Cyber-Escrow Dark Theme and Touch Target >= 44px.
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

  Color _getStatusColor() {
    switch (_state) {
      case ServerHealthState.online:
        return const Color(0xFF10B981); // Emerald
      case ServerHealthState.degraded:
        return const Color(0xFFF59E0B); // Amber
      case ServerHealthState.offline:
        return const Color(0xFFF43F5E); // Rose
      case ServerHealthState.checking:
        return const Color(0xFF06B6D4); // Cyan
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
    final statusColor = _getStatusColor();
    final statusText = _getStatusText();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Glowing status indicator dot
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: statusColor,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: statusColor.withValues(alpha: 0.6),
                  blurRadius: 6,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            statusText,
            style: TextStyle(
              color: statusColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              fontFamily: 'monospace',
            ),
          ),
          const SizedBox(width: 4),
          // Touch target >= 44x44px for manual retry
          SizedBox(
            width: 44,
            height: 44,
            child: IconButton(
              iconSize: 16,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
              icon: Icon(Icons.refresh_rounded, color: statusColor),
              tooltip: 'Kiểm tra lại kết nối backend',
              onPressed: _state == ServerHealthState.checking
                  ? null
                  : _executeHealthCheck,
            ),
          ),
        ],
      ),
    );
  }
}

