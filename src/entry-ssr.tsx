import { renderToPipeableStream } from "react-dom/server";
import App from "./App";

export async function render<Writable extends NodeJS.WritableStream>(
  url: string,
  response: Writable,
  headInjection = ""
): Promise<Writable> {
  return new Promise((res) => {
    const { pipe } = renderToPipeableStream(
      <App ssrPath={url} headInjection={headInjection} />,
      {
        onShellReady() {
          res(pipe(response));
        },
      }
    );
  });
}

export type ServerSideRenderFn = typeof render;
