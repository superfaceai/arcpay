import {
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from "libphonenumber-js";

import { z } from "zod";

export const PhoneNumber = z
  .string()
  .refine(
    (phoneNumber) => isValidPhoneNumber(phoneNumber, { defaultCountry: "US" }),
    {
      message:
        "Please specify a valid phone number (include the international prefix)",
    }
  )
  .transform((value) =>
    parsePhoneNumberWithError(value, {
      defaultCountry: "US",
    }).format("E.164")
  );
