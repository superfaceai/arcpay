import { z } from "zod";
import iso3311a2 from "iso-3166-1-alpha-2";

export const CountryCode = z
  .enum(iso3311a2.getCodes())
  .describe("ISO-3166-1 alpha-2 country code");
