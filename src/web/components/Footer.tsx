import { FC } from "hono/jsx";
import { FooterLinks } from "./FooterLinks";

interface FooterProps {}

export const Footer: FC<FooterProps> = (props: FooterProps) => {
  return (
    <footer className="primary">
      <FooterLinks />

      <span class="by">
        by
        <a href="https://superface.ai?utm_source=arcpay" target="_blank">
          <img src="/sf-logotype-dark.svg" alt="Superface" />
        </a>
      </span>
    </footer>
  );
};
