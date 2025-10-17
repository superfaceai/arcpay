import { z } from "zod";

export const DateCodec = z.codec(z.union([z.string(), z.date()]), z.date(), {
  decode: (inputDate) =>
    typeof inputDate === "string" ? new Date(inputDate) : inputDate,
  encode: (date) => date.toISOString(),
});
