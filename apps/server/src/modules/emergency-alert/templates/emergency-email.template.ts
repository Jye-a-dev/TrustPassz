/**
 * emergency-email.template.ts
 *
 * Cyber-Alert HTML email template for TrustPassz Critical Incidents.
 * Optimized for Gmail and mobile email clients with inline responsive CSS.
 * Theme: Cyber-Escrow Dark Theme (Slate-950 #0B0F17, Crimson #ef4444).
 */

export interface EmergencyEmailData {
  service: string;
  errorCode: string;
  summary: string;
  message: string;
  stackTrace?: string;
  host: string;
  environment: string;
  timestampUtc: string;
  timestampVn: string;
  dashboardUrl: string;
  metadata?: Record<string, unknown>;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderEmergencyEmailHtml(data: EmergencyEmailData): string {
  const safeService = escapeHtml(data.service);
  const safeErrorCode = escapeHtml(data.errorCode);
  const safeSummary = escapeHtml(data.summary);
  const safeMessage = escapeHtml(data.message);
  const safeHost = escapeHtml(data.host);
  const safeEnv = escapeHtml(data.environment.toUpperCase());
  const safeDashboardUrl = escapeHtml(data.dashboardUrl);

  const stackTraceHtml = data.stackTrace
    ? `
      <div style="margin-top: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #f87171; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
          Tóm Tắt Khối Stack Trace:
        </div>
        <div style="background-color: #030712; border: 1px solid #374151; border-radius: 6px; padding: 12px 14px; overflow-x: auto; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 12px; line-height: 1.5; color: #fca5a5; white-space: pre-wrap; word-break: break-all;">
          ${escapeHtml(data.stackTrace)}
        </div>
      </div>
    `
    : '';

  const metadataHtml =
    data.metadata && Object.keys(data.metadata).length > 0
      ? `
      <div style="margin-top: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
          Metadata Kỹ Thuật (Payload Ref):
        </div>
        <div style="background-color: #030712; border: 1px solid #1f2937; border-radius: 6px; padding: 10px 14px; font-family: monospace; font-size: 11px; color: #94a3b8; overflow-x: auto; white-space: pre-wrap;">
          ${escapeHtml(JSON.stringify(data.metadata, null, 2))}
        </div>
      </div>
    `
      : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[EMERGENCY - TRUSTPASSZ] ${safeSummary}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #030712; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #0b0f17; border: 1px solid #ef4444; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.25);">
          <!-- Top Emergency Header -->
          <tr>
            <td style="background-color: #b91c1c; padding: 18px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #000000; color: #f87171; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid #ef4444;">
                      CRITICAL ALERT
                    </span>
                    <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">
                      [EMERGENCY - TRUSTPASSZ] ${safeSummary}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Incident Overview Message -->
          <tr>
            <td style="padding: 24px; border-bottom: 1px solid #1f2937;">
              <div style="font-size: 13px; color: #9ca3af; line-height: 1.4; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                Thông Báo Sự Cố Hạ Tầng:
              </div>
              <div style="font-size: 15px; line-height: 1.6; color: #f3f4f6; font-weight: 500;">
                ${safeMessage}
              </div>
            </td>
          </tr>

          <!-- Technical Specs Matrix -->
          <tr>
            <td style="padding: 20px 24px; background-color: #0d131f;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="6" border="0" style="font-size: 13px;">
                <tr>
                  <td width="35%" style="color: #64748b; font-weight: 600;">Service Affected:</td>
                  <td width="65%" style="color: #38bdf8; font-weight: 700; font-family: monospace;">${safeService}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Error Code:</td>
                  <td style="color: #ef4444; font-weight: 700; font-family: monospace;">${safeErrorCode}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Severity Level:</td>
                  <td style="color: #f87171; font-weight: 700;">CRITICAL (Level 1)</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Environment / Host:</td>
                  <td style="color: #e2e8f0; font-family: monospace;">${safeEnv} / ${safeHost}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Timestamp UTC:</td>
                  <td style="color: #cbd5e1; font-family: monospace;">${escapeHtml(data.timestampUtc)}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Timestamp VN (ICT):</td>
                  <td style="color: #cbd5e1; font-family: monospace;">${escapeHtml(data.timestampVn)}</td>
                </tr>
              </table>

              ${stackTraceHtml}
              ${metadataHtml}
            </td>
          </tr>

          <!-- Action Button Footer -->
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #0b0f17; border-top: 1px solid #1f2937;">
              <a href="${safeDashboardUrl}" target="_blank" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
                Mở Dispute / Server Matrix (/admin/system)
              </a>
              <div style="margin-top: 16px; font-size: 11px; color: #64748b;">
                Cảnh báo khẩn cấp độc quyền từ TrustPassz Sentinel Reliability Engine.<br/>
                Thời gian xử lý dự kiến: &lt; 15 phút theo quy trình SLA Khẩn Cấp.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

