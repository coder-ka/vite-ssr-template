import getPort from "get-port";
import express from "express";
import { host } from "./hosting";
import { api } from "./api";

async function createServer() {
  let app = express();
  const port = await getPort({
    port: parseInt(process.env.PORT || "5173"),
  });

  app = await api(app);

  app = await host(app);

  app.listen(port, () => {
    console.log(`listening on http://localhost:${port}.`);
  });
}

createServer();
