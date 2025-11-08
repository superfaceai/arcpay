import { db } from "@/database";
import { Agent, agentId } from "./agent.entity";

const storageKey = ({
  accountId,
  live,
  id,
}: {
  accountId: string;
  id: string;
  live: boolean;
}) => `agent:${accountId}:${live ? "live" : "test"}:${id}`;

export const saveAgent = async ({
  agent,
  accountId,
  live,
}: {
  agent: Agent;
  accountId: string;
  live: boolean;
}) => {
  await db.hset(storageKey({ accountId, live, id: agent.id }), agent);
};

export const listAgents = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Agent[]> => {
  return [
    {
      id: agentId(),
      name: "Dash (Office Bot)",
      on_behalf_of: accountId,
      allowance: {
        frequency: "monthly",
        amount: "250",
        currency: "USDC",
        categories: ["food", "beverages", "stationary", "other"],
      },
      rules: ["buy supplies for office", "buy food for office"],
    },
  ];
};
