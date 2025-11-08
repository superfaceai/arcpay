import { Account } from "@/identity/entities";
import type { FC } from "hono/jsx";

export const AppLayout: FC = (props) => {
  return <div className="app-layout">{props.children}</div>;
};

type NavigationProps = {
  backLink?: string;
  account: Account;
};
export const AppNavigation: FC<NavigationProps> = (props: NavigationProps) => {
  const acronym = props.account.name
    .split(" ")
    .map((name) => name[0].toUpperCase())
    .join("");

  return (
    <nav className="app-navigation">
      <div>
        {props.backLink && (
          <a href={props.backLink} className="button ghost">
            <div className="avatar">←</div>
          </a>
        )}
      </div>

      <a href="/my-account" className="button ghost">
        <div className="avatar">{acronym}</div>
        <span style={{ padding: "0 0.75rem 0 0" }}>{props.account.name}</span>
      </a>
    </nav>
  );
};
