import React from "react";
import ReactDOM from "react-dom/client";
import { Router } from "wouter";
import useBrowserLocation from "wouter/use-location";
import App from "./App";
import "./index.css";

ReactDOM.hydrateRoot(
  document.getElementById("root") as HTMLElement,
  <React.StrictMode>
    <Router
      hook={(options) => {
        const { pathname, search } = new URL(location.href);

        const [_, nav] = useBrowserLocation(options);

        return [pathname + search, nav];
      }}
    >
      <App />
    </Router>
  </React.StrictMode>
);
