import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendSummaryEmail(toEmail: string, summaryContent: string): Promise<boolean> {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Convert markdown to HTML properly
    let html = summaryContent
      // Headers
      .replace(/^### (.+)$/gm, '<h3 style="color: #667eea; font-size: 16px; margin: 24px 0 12px 0; font-weight: 600; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color: #4b5563; font-size: 20px; margin: 28px 0 16px 0; font-weight: 600;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color: #1f2937; font-size: 24px; margin: 0 0 24px 0; font-weight: 700;">$1</h1>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #374151; font-weight: 600;">$1</strong>')
      // Code/technical terms
      .replace(/`(.+?)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>')
      // Line breaks
      .split('\n\n').map(para => {
        if (para.trim().startsWith('<h') || para.trim().startsWith('<ul') || para.trim().startsWith('<ol')) {
          return para;
        }
        return `<p style="margin: 12px 0; line-height: 1.6; color: #374151;">${para.replace(/\n/g, '<br>')}</p>`;
      }).join('');
    
    const mailOptions = {
      from: `"Japanese Learning Journey 🌸" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🌸 Your Daily Japanese Summary - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">📚 Daily Learning Summary</h1>
                      <p style="margin: 12px 0 0 0; color: #e0e7ff; font-size: 15px; font-weight: 500;">${today}</p>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px; color: #1f2937; font-size: 15px; line-height: 1.7; background-color: #ffffff;">
                      ${html}
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background: linear-gradient(to bottom, #f9fafb, #f3f4f6); padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #667eea; font-size: 18px; font-weight: 600;">頑張って！</p>
                      <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">(Ganbatte!) Keep up the great work!</p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">Japanese Learning Journey • Made with ❤️</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}