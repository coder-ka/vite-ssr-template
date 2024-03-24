import getPort from "get-port";
import express from "express";
import { api } from "./api";
import compression from "compression";
import { ssr } from "./lib/ssr";

async function createServer() {
  let app = express();
  const port = await getPort({
    port: parseInt(process.env.PORT || "5173"),
  });

  app = await api(app);

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    app.use(compression());
  }

  app = await ssr(app, isProduction);

  app.listen(port, () => {
    console.log(`listening on http://localhost:${port}.`);
  });
}

createServer();
