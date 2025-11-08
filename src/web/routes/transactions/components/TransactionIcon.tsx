import { FC } from "hono/jsx";

import { IconBanknoteUp, IconCoins } from "@/web/components/icons";

type TransactionIconProps = {
  type: "payment" | "capture" | "raw";
};

export const TransactionIcon: FC<TransactionIconProps> = (
  props: TransactionIconProps
) => {
  return (
    <div className="transaction-icon">
      {props.type === "payment" ? <IconBanknoteUp /> : <IconCoins />}
    </div>
  );
};
