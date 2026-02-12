import { z } from "zod";
import { Result, PhoneNumber } from "@/lib";
import {
  MessageError,
  TransactionalEmailError,
  TransactionalSMSError,
} from "@/communications/errors";

export type SendTransactionalSMS = (input: {
  to: z.infer<typeof PhoneNumber>;
  message: string;
}) => Promise<Result<{ status: "sent" | "failed" }, TransactionalSMSError>>;

export type SendTransactionalEmail = (input: {
  to: string;
  subject: string;
  plainTextMessage: string;
}) => Promise<Result<{ status: "sent" | "failed" }, TransactionalEmailError>>;

export type SendMessage = (input: {
  channelId: string;
  message: string;
}) => Promise<Result<{ status: "sent" | "failed" }, MessageError>>;
