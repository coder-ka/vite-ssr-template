import { PipeableStream, renderToPipeableStream } from "react-dom/server";
import App from "./App";

export async function render(
  url: string,
  options = {
    bootstrapModules: [] as string[],
  }
): Promise<PipeableStream> {
  return new Promise((resolve, reject) => {
    const pipeableStream = renderToPipeableStream(<App ssrPath={url} />, {
      onShellError(error) {
        reject(error);
      },
      onShellReady() {
        resolve(pipeableStream);
      },
      bootstrapModules: options.bootstrapModules,
    });
  });
}

export type ServerSideRenderFn = typeof render;
