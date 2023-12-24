import express from "express";
import fs from "fs/promises";
import path from "path";
import compression from "compression";
import mustache from "mustache";
import getPort from "get-port";

export async function host(app: express.Express) {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    // production server code

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
            // gzip
            // res.setHeader("Content-Encoding", "gzip");
          }
        },
      })
    );

    app.use(async (req, res, next) => {
      const template = await fs.readFile(
        path.resolve(__dirname, "client", "index.html"),
        "utf-8"
      );

      const url = req.originalUrl;

      try {
        const { render } = await import(
          path.resolve(__dirname, "ssr", "entry-ssr.js")
        );

        const { appHtml, head, htmlAttributes, bodyAttributes } = await render(
          url
        );

        const html = mustache.render(template, {
          head,
          htmlAttributes,
          bodyAttributes,
          ssrOutlet: appHtml,
        });

        res
          .status(200)
          .set({ "Content-Type": "text/html", "Cache-Control": "no-cache" })
          .end(html);
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
        // 1. Read index.html
        let template = await fs.readFile(
          path.resolve(__dirname, "..", "index.html"),
          "utf-8"
        );

        // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
        //    also applies HTML transforms from Vite plugins, e.g. global preambles
        //    from @vitejs/plugin-react
        template = await vite.transformIndexHtml(url, template);

        // 3. Load the server entry. vite.ssrLoadModule automatically transforms
        //    your ESM source code to be usable in Node.js! There is no bundling
        //    required, and provides efficient invalidation similar to HMR.
        const { render } = await vite.ssrLoadModule(
          path.resolve(__dirname, "..", "src", "entry-ssr.tsx")
        );

        // 4. render the app HTML. This assumes entry-ssr.js's exported `render`
        //    function calls appropriate framework SSR APIs,
        //    e.g. ReactDOMServer.renderToString()
        const { appHtml, head, htmlAttributes, bodyAttributes } = await render(
          url
        );

        // 5. Inject the app-rendered HTML into the template.
        const html = mustache.render(template, {
          head,
          htmlAttributes,
          bodyAttributes,
          ssrOutlet: appHtml,
        });

        // 6. Send the rendered HTML back.
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
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
