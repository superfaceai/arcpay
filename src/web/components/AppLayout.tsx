import { Account } from "@/identity/entities";
import type { FC } from "hono/jsx";
import { Logo } from "./Logo";
import { FooterLinks } from "./FooterLinks";

export const AppLayout: FC = (props) => {
  return (
    <div className="app-layout">
      <div className="app-content">{props.children}</div>

      <footer>
        <FooterLinks />
      </footer>
    </div>
  );
};

type AppNavigationProps = {
  backLink?: string;
  account: Account;
};
export const AppNavigation: FC<AppNavigationProps> = (
  props: AppNavigationProps
) => {
  const acronym = props.account.name
    .split(" ")
    .map((name) => name[0].toUpperCase())
    .join("");

  return (
    <nav className="app-navigation">
      <div>
        {props.backLink ? (
          <a href={props.backLink} className="button ghost">
            <div className="avatar">←</div>
          </a>
        ) : (
          <Logo variant="short" size="medium" />
        )}
      </div>

      <a href="/my-account" className="account button ghost">
        <div className="avatar">{acronym}</div>
        <span className="name">{props.account.name}</span>
      </a>
    </nav>
  );
};
