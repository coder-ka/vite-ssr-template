import express from "express";
import path from "path";
import compression from "compression";
import getPort from "get-port";
import { ServerSideRenderFn } from "./entry-ssr";
import { Transform, TransformCallback } from "stream";
import { ViteDevServer } from "vite";
import { parse as parseHTML } from "node-html-parser";
import { readFile } from "fs/promises";
import { RewritingStream } from "parse5-html-rewriting-stream";

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
    const indexHTMLRoot = parseHTML(indexHTML);
    const headInjection = indexHTMLRoot.querySelector("head")?.innerHTML || "";

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await import(
          path.resolve(__dirname, "ssr", "entry-ssr.js")
        )) as { render: ServerSideRenderFn };

        const { pipe } = await render(url);

        pipe(createStreamToInsertCodeAtEndOfTag("head", headInjection)).pipe(
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

        const { pipe } = await render(url);

        pipe(
          createStreamToInsertCodeAtEndOfTag(
            "body",
            `<script type="module" src="/src/entry-client.tsx"></script>`
          )
        )
          .pipe(new ViteTransformIndexHtmlTransform(url, vite))
          .pipe(res.status(200).setHeader("content-type", "text/html"));
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

class ViteTransformIndexHtmlTransform extends Transform {
  private chunks: Buffer[];

  constructor(private url: string, private vite: ViteDevServer) {
    super();
    this.chunks = [];
  }

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.chunks.push(chunk);
    callback();
  }

  _flush(callback: TransformCallback): void {
    const html = Buffer.concat(this.chunks).toString("utf-8");

    this.vite.transformIndexHtml(this.url, html).then((html) => {
      this.push(html);
      this.chunks = [];
      callback();
    });
  }
}

function createStreamToInsertCodeAtEndOfTag(
  targetTagName: string,
  codeToInsert: string
): Transform {
  const rewritingStream = new RewritingStream();
  const transformStream = new Transform();

  rewritingStream.on("startTag", (startTag) => {
    rewritingStream.emitStartTag(startTag);
  });

  rewritingStream.on("endTag", (endTag) => {
    if (endTag.tagName === targetTagName) {
      rewritingStream.emitRaw(codeToInsert);
    }
    rewritingStream.emitEndTag(endTag);
  });

  transformStream._transform = function (chunk, _, callback) {
    const stringChunk = chunk.toString();
    rewritingStream.write(stringChunk);
    callback();
  };

  rewritingStream.on("data", (chunk) => {
    transformStream.push(Buffer.from(chunk));
  });

  rewritingStream.on("end", () => {
    transformStream.end();
  });

  return transformStream;
}
