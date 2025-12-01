import nodemailer, { SentMessageInfo } from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true if port is 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailAttachment {
  filename: string;
  path?: string; // local file path or URL
  content?: Buffer | string; // file content directly
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<SentMessageInfo> => {
  try {
    const mailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: EmailAttachment[];
    } = {
      from: process.env.FROM_EMAIL || "",
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    console.table([
      {
        Status: "📨 Email sent",
        "From": info.envelope.from,
        "To": info.envelope.to,
        "Message ID": info.messageId,
      },
    ]);

    return info;
  } catch (error: any) {
    console.error("⚡ Error sending email:", error);
    throw new Error(error.message || "Failed to send email");
  }
};
