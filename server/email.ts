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
    
    // Convert markdown to HTML
    const htmlContent = summaryContent
      .replace(/^# (.+)$/gm, '<h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">$1</h2>')
      .replace(/^## (.+)$/gm, '<h3 style="color: #4b5563; font-size: 18px; margin: 20px 0 12px 0; font-weight: 600;">$1</h3>')
      .replace(/^\d+\.\s\*\*(.+?)\*\*\s*-\s*(.+)$/gm, '<div style="margin: 10px 0;"><strong style="color: #667eea;">$1</strong> - $2</div>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #374151;">$1</strong>')
      .replace(/^-\s(.+)$/gm, '<li style="margin: 6px 0; color: #4b5563;">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>)/s, '<ul style="margin: 10px 0; padding-left: 20px;">$1</ul>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    
    const mailOptions = {
      from: `"Japanese Learning Journey" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🌸 Your Japanese Progress - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">${today}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px; color: #1f2937; font-size: 15px; line-height: 1.7;">
                      ${htmlContent}
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">頑張って！(Ganbatte!) - You've got this!</p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">Japanese Learning Journey • Sent with ❤️</p>
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