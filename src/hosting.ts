import express from "express";
import path from "path";
import compression from "compression";
import getPort from "get-port";
import { ServerSideRenderFn } from "./entry-ssr";
import { parse as parseHTML } from "node-html-parser";
import { readFile } from "fs/promises";
import { createStreamForTagInsertion } from "./util/createStreamForTagInsertion";
import { ViteDevServer } from "vite";

export async function host(app: express.Express) {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    app.use(compression());

    const clientDir = path.resolve(__dirname, "client");

    app.use(
      express.static(clientDir, {
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

    const indexHTMLPath = path.join(clientDir, "index.html");
    const indexHTML = await readFile(indexHTMLPath, "utf-8");
    const headInjection = extractHeadInjection(indexHTML);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await import(
          path.resolve(__dirname, "ssr", "entry-ssr.js")
        )) as { render: ServerSideRenderFn };

        const { pipe: pipeSSR } = await render(url);

        pipeSSR(createStreamForTagInsertion("head", headInjection)).pipe(
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

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: await getPort(),
        },
      },
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await vite.ssrLoadModule(
          path.resolve(__dirname, "..", "src", "entry-ssr.tsx")
        )) as { render: ServerSideRenderFn };

        const { pipe: pipeSSR } = await render(url, {
          bootstrapModules: ["/src/entry-client.tsx"],
        });

        pipeSSR(
          createStreamForTagInsertion("html", createHeadInjection(vite, url), {
            position: "afterTag",
          })
        ).pipe(res.status(200).setHeader("content-type", "text/html"));
      } catch (e) {
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  return app;
}

function extractHeadInjection(html: string) {
  const indexHTMLRoot = parseHTML(html);
  const headEl = indexHTMLRoot.querySelector("head");
  const headInjection = headEl ? headEl.innerHTML : "";

  return headInjection;
}

async function createHeadInjection(vite: ViteDevServer, url: string) {
  const indexHTMLPath = path.join(__dirname, "..", "index.html");
  const indexHTML = await readFile(indexHTMLPath, "utf-8");
  const viteTransformed = await vite.transformIndexHtml(url, indexHTML);
  return extractHeadInjection(viteTransformed);
}
