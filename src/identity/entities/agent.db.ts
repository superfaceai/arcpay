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
      id: "agt_c8UsxMvPnlGMVN3Hd19cm",
      name: "Dash (Office Bot)",
      on_behalf_of: accountId,
      allowance: {
        frequency: "monthly",
        amount: "250",
        currency: "USDC",
        categories: ["food", "beverages", "stationary"],
      },
      rules: ["buy supplies for office", "buy food for office"],
    },
  ];
};

export const loadAgentById = async ({
  accountId,
  live,
  id,
}: {
  accountId: string;
  live: boolean;
  id: string;
}): Promise<Agent | null> => {
  const agent = await db.hgetall<Agent>(storageKey({ accountId, live, id }));
  if (!agent) return null;
  return Agent.parse(agent);
};
