import { ReactNode } from "react";

export function PageBase({
  subtitle,
  description,
  children,
}: {
  subtitle: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`My Site - ${subtitle}`}</title>
        <meta name="description" content={description} />
      </head>
      <body>{children}</body>
    </>
  );
}
