import { FC } from "hono/jsx";

interface FooterProps {}

export const Footer: FC<FooterProps> = (props: FooterProps) => {
  return (
    <footer className="primary">
      <span class="copyright">&copy; 2025</span>

      <span class="by">
        by
        <a href="https://superface.ai?utm_source=arcpay" target="_blank">
          <img src="/sf-logotype-dark.svg" alt="Superface" />
        </a>
      </span>
    </footer>
  );
};
