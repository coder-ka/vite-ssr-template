import { renderToPipeableStream } from "react-dom/server";
import App from "./App";

export async function render(
  url: string,
  options = {
    bootstrapModules: [] as string[],
  }
): Promise<{
  pipe<TStream extends NodeJS.WritableStream>(stream: TStream): TStream;
}> {
  return new Promise((resolve, reject) => {
    const { pipe } = renderToPipeableStream(<App ssrPath={url} />, {
      onShellError(error) {
        reject(error);
      },
      onShellReady() {
        resolve({ pipe });
      },
      bootstrapModules: options.bootstrapModules,
    });
  });
}

export type ServerSideRenderFn = typeof render;
