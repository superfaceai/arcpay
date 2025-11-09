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
          content="Secure and easy way for your AI agents to pay for physical or digital goods and services—autonomously, on your terms"
        />
        <meta
          name="keywords"
          content="Arc Pay, payments, AI agents, USDC, Arc Network"
        />
        <meta name="theme-color" content="#ffffff" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Arc Pay" />
        <meta
          property="og:description"
          content="Secure and easy way for your AI agents to pay for physical or digital goods and services—autonomously, on your terms"
        />
        <meta property="og:site_name" content="Arc Pay" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arc Pay" />
        <meta
          name="twitter:description"
          content="Secure and easy way for your AI agents to pay for physical or digital goods and services—autonomously, on your terms"
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

        <title>Arc Pay</title>
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
