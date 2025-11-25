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
          content="Arc Pay lets your AI assistants make approved purchases on their own. You set the limits and rules—and every payment stays visible and under control."
        />
        <meta
          name="keywords"
          content="Arc Pay, agentic wallet, payments, AI agents, USDC, Arc Network"
        />
        <meta name="theme-color" content="#ffffff" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Arc Pay • Agentic Wallet" />
        <meta
          property="og:description"
          content="Arc Pay lets your AI assistants make approved purchases on their own. You set the limits and rules—and every payment stays visible and under control."
        />
        <meta property="og:site_name" content="Arc Pay • Agentic Wallet" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arc Pay • Agentic Wallet" />
        <meta
          name="twitter:description"
          content="Arc Pay lets your AI assistants make approved purchases on their own. You set the limits and rules—and every payment stays visible and under control."
        />

        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        <title>Arc Pay • Agentic wallet</title>
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
