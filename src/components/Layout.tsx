import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Arc Pay</title>
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
