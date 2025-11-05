import Twilio from "twilio";
import Config from "@/config";

export const client =
  Config.TWILIO_ACCOUNT_SID &&
  Config.TWILIO_AUTH_TOKEN &&
  Config.TWILIO_PHONE_NUMBER
    ? Twilio(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
    : undefined;

type TwilioClient = ReturnType<typeof Twilio>;

export type TwilioMessage = Awaited<
  ReturnType<TwilioClient["messages"]["create"]>
>;
