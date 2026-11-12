/**
 * templates/test-email.template.ts
 *
 * Cyber-Alert HTML template for manual SMTP connection test probe.
 */

export interface TestEmailTemplateParams {
  actor: string;
  formattedDate: string;
  customMessage?: string;
}

export function renderTestEmailHtml(params: TestEmailTemplateParams): string {
  const { actor, formattedDate, customMessage } = params;
  return `
    <div style="background-color: #080C14; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; border-radius: 8px; border: 1px solid #1E293B; max-width: 600px; margin: 0 auto;">
      <div style="display: flex; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 12px; margin-bottom: 16px;">
        <span style="background-color: #06B6D4; color: #080C14; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">TEST - EMERGENCY CONNECTION</span>
        <span style="margin-left: 12px; font-size: 14px; color: #94A3B8;">TrustPassz Sentinel Dispatch Probe</span>
      </div>
      <h2 style="color: #F8FAFC; margin-top: 0; font-size: 18px;">Kiểm tra đường truyền Cảnh báo Khẩn cấp tức thì</h2>
      <p style="color: #94A3B8; font-size: 13px; line-height: 1.6;">
        Đây là email thử nghiệm kết nối hệ thống Nodemailer / Google Workspace SMTP được kích hoạt thủ công từ <strong>Admin Portal</strong>.
      </p>
      <div style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 6px; padding: 14px; margin: 16px 0; font-size: 12px; font-family: monospace;">
        <div style="margin-bottom: 6px;"><strong style="color: #06B6D4;">Kích hoạt bởi:</strong> ${actor}</div>
        <div style="margin-bottom: 6px;"><strong style="color: #10B981;">Thời gian gửi:</strong> ${formattedDate}</div>
        <div style="margin-bottom: 6px;"><strong style="color: #F59E0B;">SLA Mục tiêu:</strong> &lt; 2000 ms (HTTP 200 OK)</div>
        ${
          customMessage
            ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #334155;"><strong style="color: #E2E8F0;">Ghi chú:</strong> ${customMessage}</div>`
            : ''
        }
      </div>
      <p style="font-size: 11px; color: #64748B; margin-bottom: 0;">
        Hệ thống bảo mật TrustPassz Escrow &bull; Tự động lưu vết Audit Log trong cơ sở dữ liệu.
      </p>
    </div>
  `;
}

