import express from "express";

export async function api(app: express.Express) {
  app.get("/api", (_, res) => {
    return res.send("hello world");
  });

  return app;
}
