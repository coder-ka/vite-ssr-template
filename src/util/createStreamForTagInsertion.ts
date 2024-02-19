import { RewritingStream } from "parse5-html-rewriting-stream";
import { Transform } from "stream";

type InsertionPosition = "tagStart" | "tagEnd" | "beforeTag" | "afterTag";

interface InsertionOptions {
  position?: InsertionPosition;
}

export function createStreamForTagInsertion(
  targetTagName: string,
  codeToInsert: string,
  options: InsertionOptions = {}
): Transform {
  const { position = "tagEnd" } = options; // デフォルト値を設定
  const rewritingStream = new RewritingStream();
  const transformStream = new Transform();

  rewritingStream.on("startTag", (startTag) => {
    if (position === "beforeTag" && startTag.tagName === targetTagName) {
      rewritingStream.emitRaw(codeToInsert);
    }
    rewritingStream.emitStartTag(startTag);
    if (position === "tagStart" && startTag.tagName === targetTagName) {
      rewritingStream.emitRaw(codeToInsert);
    }
  });

  rewritingStream.on("endTag", (endTag) => {
    if (position === "tagEnd" && endTag.tagName === targetTagName) {
      rewritingStream.emitRaw(codeToInsert);
    }
    rewritingStream.emitEndTag(endTag);
    if (position === "afterTag" && endTag.tagName === targetTagName) {
      rewritingStream.emitRaw(codeToInsert);
    }
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

  transformStream.setEncoding("utf8");

  return transformStream;
}
