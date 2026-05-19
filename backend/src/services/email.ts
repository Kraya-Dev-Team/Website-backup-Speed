import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { EmailTemplates } from "./EmailTemplates.js";

const sesClient = new SESClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export const emailService = {
  async send(options: EmailOptions): Promise<{ success: boolean; message: string; messageId?: string }> {
    const { to, subject, body, isHtml = false, replyTo, cc, bcc } = options;

    const toAddresses = Array.isArray(to) ? to : [to];
    const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    const params: SendEmailCommandInput = {
      Source: `"${config.ses.fromName}" <${config.ses.fromEmail}>`,
      Destination: {
        ToAddresses: toAddresses,
        CcAddresses: ccAddresses,
        BccAddresses: bccAddresses,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: isHtml
          ? {
              Html: {
                Data: body,
                Charset: "UTF-8",
              },
            }
          : {
              Text: {
                Data: body,
                Charset: "UTF-8",
              },
            },
      },
    };

    if (replyTo) {
      params.ReplyToAddresses = [replyTo];
    }

    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      logger.info(">>> EMAIL_SENT", { to: toAddresses, subject, messageId: result.MessageId });
      return {
        success: true,
        message: "Email sent successfully",
        messageId: result.MessageId,
      };
    } catch (error) {
      logger.error(">>> EMAIL_SEND_ERROR", { error, to: toAddresses, subject });
      return {
        success: false,
        message: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },

  async sendOTPEmail(to: string, otp: string): Promise<{ success: boolean; message: string }> {
    const t = EmailTemplates.otp(otp);
    return this.send({ to, subject: t.subject, body: t.html, isHtml: true });
  },

  async sendWelcomeEmail(to: string, name: string): Promise<{ success: boolean; message: string }> {
    const t = EmailTemplates.welcome(to, name);
    return this.send({ to, subject: t.subject, body: t.html, isHtml: true });
  },

  // kept for backward compatibility; prefer EmailNotificationService.orderPlaced()
  async sendOrderConfirmation(to: string, orderId: string, details: string): Promise<{ success: boolean; message: string }> {
    const subject = `Order Confirmation — ${orderId}`;
    return this.send({ to, subject, body: details, isHtml: false });
  },
};