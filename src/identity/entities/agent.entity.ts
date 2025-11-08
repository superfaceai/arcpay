import Big from "big.js";
import { z } from "zod";

import { Amount, Currency } from "@/balances/values";
import { generateId } from "@/lib";

export const agentId = () => generateId("agt");

export const AgentAllowance = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  amount: Amount,
  currency: Currency,
  categories: z.array(z.enum(["food", "beverages", "stationary", "other"])),
});
export type AgentAllowance = z.infer<typeof AgentAllowance>;

export const Agent = z.object({
  id: z.string(),
  name: z.string().min(3),
  on_behalf_of: z.string(), // Account
  allowance: AgentAllowance,
  rules: z.array(z.string()),
});
export type Agent = z.infer<typeof Agent>;

export type AgentWithRemainingAllowance = Agent & {
  remainingAllowance: {
    amount: Amount;
    percentage: number;
  };
};

export const withRemainingAllowance = (
  agent: Agent,
  totalAvailable: Amount
): AgentWithRemainingAllowance => {
  const remainingAmount = Big(totalAvailable).lt(Big(agent.allowance.amount))
    ? Big(totalAvailable).toString()
    : agent.allowance.amount;
  return {
    ...agent,
    remainingAllowance: {
      amount: remainingAmount,
      percentage: Big(remainingAmount)
        .div(Big(agent.allowance.amount))
        .toNumber(),
    },
  };
};
