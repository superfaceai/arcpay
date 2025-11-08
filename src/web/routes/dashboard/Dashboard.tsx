import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

type MyAccountProps = {};

export const Dashboard: FC<MyAccountProps> = (props: MyAccountProps) => {
  return (
    <Layout>
      <h1>Dashboard</h1>
    </Layout>
  );
};
