import express from "express";
import path from "path";
import compression from "compression";
import getPort from "get-port";
import { StringWritable } from "./stream-util";
import { ServerSideRenderFn } from "./entry-ssr";

export async function host(app: express.Express) {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    app.use(compression());

    app.use(
      express.static(path.resolve(__dirname, "client"), {
        index: false,
        setHeaders(res, filePath) {
          if (path.basename(filePath) === "index.html") {
            res.setHeader("Cache-Control", "no-cache");
          } else {
            // cache-busting for 1 year if not index.html
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable"
            );
          }
        },
      })
    );

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await import(
          path.resolve(__dirname, "ssr", "entry-ssr.js")
        )) as { render: ServerSideRenderFn };

        render(
          url,
          res
            .status(200)
            .set({ "Content-Type": "text/html", "Cache-Control": "no-cache" })
        );
      } catch (e) {
        next(e);
      }
    });
  } else {
    const { createServer: createViteServer } = await import("vite");

    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: await getPort(),
        },
      },
      appType: "custom",
    });

    // use vite's connect instance as middleware
    // if you use your own express router (express.Router()), you should use router.use
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await vite.ssrLoadModule(
          path.resolve(__dirname, "..", "src", "entry-ssr.tsx")
        )) as { render: ServerSideRenderFn };

        const stringWritable = new StringWritable();
        const rendered = await render(url, stringWritable);

        rendered.end();

        const html = await vite.transformIndexHtml(
          url,
          rendered.data +
            `<script type="module" src="/src/entry-client.tsx"></script>`
        );

        res.status(200).setHeader("content-type", "text/html").end(html);
      } catch (e) {
        // If an error is caught, let Vite fix the stack trace so it maps back to
        // your actual source code.
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  return app;
}
