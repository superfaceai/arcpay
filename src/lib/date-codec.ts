import { z } from "zod";

export const DateCodec = z.codec(z.union([z.string(), z.date()]), z.date(), {
  decode: (inputDate) =>
    typeof inputDate === "string" ? new Date(inputDate) : inputDate,
  encode: (date) => date.toISOString(),
});

export function toRFC3339(date: Date): string {
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? "+" : "-";
  const pad = (n: number): string =>
    String(Math.floor(Math.abs(n))).padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    diff +
    pad(tzOffset / 60) +
    ":" +
    pad(tzOffset % 60)
  );
}
