import {
  renderToPipeableStream,
  RenderToPipeableStreamOptions,
} from "react-dom/server";
import App from "./App";
import { ServerSideRenderFn } from "@coder-ka/vite-react18-ssr/server";

export const render: ServerSideRenderFn = (
  url: string,
  options: RenderToPipeableStreamOptions = {}
) => {
  return new Promise((resolve, reject) => {
    const pipeableStream = renderToPipeableStream(<App ssrPath={url} />, {
      ...options,
      onShellError(error) {
        reject(error);
      },
      onShellReady() {
        resolve(pipeableStream);
      },
    });
  });
};
