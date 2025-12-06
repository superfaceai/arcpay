import { FC, PropsWithChildren } from "hono/jsx";
import { IconZap } from "./icons";

type AgentHeaderProps = {
  agentName: string;
};
export const AgentHeader: FC<PropsWithChildren<AgentHeaderProps>> = (props) => {
  return (
    <div className="agent-header">
      <div className="avatar">
        <IconZap />
      </div>

      <h1>{props.agentName}</h1>

      {props.children}
    </div>
  );
};
