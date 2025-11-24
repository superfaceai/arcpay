import { FC } from "hono/jsx";

type LogoProps = {
  variant: "full" | "short";
  size: "medium" | "large";
};

const logoSizeClass: Record<LogoProps["size"], string> = {
  medium: "logo medium",
  large: "logo large",
};

export const Logo: FC<LogoProps> = (props: LogoProps) => {
  return (
    <div className={logoSizeClass[props.size]}>
      <span>◠</span> {props.variant === "full" ? "Arc Pay" : "Pay"}
    </div>
  );
};
