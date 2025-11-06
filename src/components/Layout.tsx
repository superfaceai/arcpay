import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Arc Pay</title>
        <style>
          {`
            body {
              font-family: system-ui, sans-serif;
              font-size: 1rem;
              line-height: 1.3;
              margin: 0;
              padding: 0;
            }
            code, pre {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", "Courier New", monospace;
              font-size: 0.9rem;
              padding: 0.2rem;
              border-radius: 0.3rem;
              background-color:rgb(236, 236, 238);
            }
            pre {
              padding: 0.75rem;
              overflow-x: auto;
            }
            main {
              margin: 0 auto;
              padding: 2rem 0.5rem;
              box-sizing: border-box;
              width: 100%;
              max-width: 70ch;
            }
            ul.resources {
              padding: 0;
              list-style-type: none;
            }
            ul.resources > li {
              padding: 0.5rem;
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            ul.resources > li > div:nth-child(2) {
              display: flex;
              flex-wrap: wrap;
              justify-content: end;
              gap: 0.2rem;
            }
            ul.resources > li:nth-child(even) {
              background-color: #f9f9f9;
              border-radius: 0.3rem;
            }
            .not-implemented {
              opacity: 0.3;
              cursor: not-allowed;
            }
          `}
        </style>
      </head>
      <body>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
