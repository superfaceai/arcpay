import { FC } from "hono/jsx";
import { Logo } from "@/web/components/Logo";

interface HeaderProps {
  logoHref?: string;
}

export const Header: FC<HeaderProps> = (props: HeaderProps) => {
  return (
    <header className="primary">
      <Logo variant="full" size="small" href={props.logoHref || "/"} />

      <nav>
        <a href="/docs/api" className="button ghost small">
          Developers
        </a>
        <a href="/login" className="button primary small">
          Log in
        </a>
      </nav>
    </header>
  );
};
