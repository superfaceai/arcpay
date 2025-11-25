import { FC } from "hono/jsx";

type LogoProps = {
  variant: "full" | "short";
  size: "small" | "medium" | "large";
  href?: string;
};

const logoSizeClass: Record<LogoProps["size"], string> = {
  small: "logo small",
  medium: "logo medium",
  large: "logo large",
};

export const Logo: FC<LogoProps> = (props: LogoProps) => {
  return (
    <div className={logoSizeClass[props.size]}>
      {props.href && <a href={props.href} />}
      <span>◠</span> {props.variant === "full" ? "Arc Pay" : "Pay"}
    </div>
  );
};
