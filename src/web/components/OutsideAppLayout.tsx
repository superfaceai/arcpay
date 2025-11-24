import type { FC } from "hono/jsx";
import { Logo } from "./Logo";

export const OutsideAppLayout: FC = (props) => {
  return <div className="outside-app-layout">{props.children}</div>;
};

type OutsideNavigationProps = {
  closeLink?: string;
};
export const OutsideNavigation: FC<OutsideNavigationProps> = (
  props: OutsideNavigationProps
) => {
  return (
    <nav className="outside-navigation">
      <div className="narrow">
        <Logo variant="short" size="medium" />

        <div>
          {props.closeLink && (
            <a href={props.closeLink} className="button ghost">
              <div className="avatar">×</div>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};
