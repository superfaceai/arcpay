import { FC } from "hono/jsx";

interface FooterLinksProps {}

export const FooterLinks: FC<FooterLinksProps> = (props: FooterLinksProps) => {
  return (
    <div class="footer-links">
      <span class="muted">&copy; {new Date().getFullYear()}</span>

      <a href="mailto:support@arcpay.ai?subject=Feedback%20on%20Arc%20Pay">
        Feedback
      </a>

      <a href="mailto:support@arcpay.ai">Support</a>
    </div>
  );
};
