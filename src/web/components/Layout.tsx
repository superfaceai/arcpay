import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Arc Pay: Secure and easy way for AI agents to pay for goods and services autonomously."
        />
        <meta
          name="keywords"
          content="Arc Pay, payments, AI agents, USDC, Arc Network"
        />
        <link rel="icon" href="/favicon.ico" />
        <title>Arc Pay</title>
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
