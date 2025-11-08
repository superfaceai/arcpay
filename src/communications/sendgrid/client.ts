import sgMail from "@sendgrid/mail";
import Config from "@/config";

export const client =
  Config.SENDGRID_API_KEY && Config.SENDGRID_FROM_EMAIL
    ? (() => {
        sgMail.setApiKey(Config.SENDGRID_API_KEY);
        return sgMail;
      })()
    : undefined;

export type SendGridClient = typeof sgMail;
export type SendGridResponse = Awaited<ReturnType<SendGridClient["send"]>>;
