import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import App from "./App";

export async function render(url: string) {
  return renderToString(
    <React.StrictMode>
      <Router ssrPath={url}>
        <App />
      </Router>
    </React.StrictMode>
  );
}
