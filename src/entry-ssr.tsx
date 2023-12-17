import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import App from "./App";
import { Helmet } from "react-helmet";

export async function render(url: string) {
  const appHtml = renderToString(
    <React.StrictMode>
      <Router ssrPath={url}>
        <App />
      </Router>
    </React.StrictMode>
  );

  const helmet = Helmet.renderStatic();

  return {
    appHtml,
    htmlAttributes: helmet.htmlAttributes.toString(),
    bodyAttributes: helmet.bodyAttributes.toString(),
    head: [
      helmet.title.toString(),
      helmet.meta.toString(),
      helmet.link.toString(),
      helmet.base.toString(),
    ].join(""),
  };
}
