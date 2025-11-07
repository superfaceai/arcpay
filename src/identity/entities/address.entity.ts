import { z } from "zod";
import { CountryCode, generateId, PhoneNumber } from "@/lib";

// TODO: Remove `temp` when we have a real addresses
export const addressId = () => generateId("addr_temp");

export const Address = z.object({
  id: z.string().default(addressId()),
  label: z.string(),
  purposes: z.array(z.enum(["billing", "shipping"])),
  name: z.string().max(256),
  line_one: z.string().max(60),
  line_two: z.string().max(60).optional(),
  city: z.string().max(60),
  state: z.string().max(60).optional(),
  country: CountryCode,
  zip: z.string().max(20),
  phone_number: PhoneNumber.optional(),
});

export type Address = z.infer<typeof Address>;

export const DEFAULT_MOCK_ADDRESSES: Address[] = [
  Address.parse({
    id: addressId(),
    label: "Main Office (2nd floor)",
    purposes: ["billing", "shipping"],
    name: "Superface Inc",
    line_one: "1111B Governors Ave",
    line_two: "Apt 101",
    city: "San Francisco",
    state: "CA",
    country: "US",
    zip: "94131",
  }),
  Address.parse({
    id: addressId(),
    label: "Marketing Office (7th floor)",
    purposes: ["shipping"],
    name: "Superface Marketing Inc",
    line_one: "123 Main St",
    city: "Anytown",
    state: "DE",
    country: "US",
    zip: "12345",
  }),
];
