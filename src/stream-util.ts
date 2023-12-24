import { Writable } from "node:stream";

export class StringWritable extends Writable {
  data = "";

  constructor() {
    super();
  }

  _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    done: (error?: Error | null) => void
  ) {
    this.data += chunk.toString("utf-8");
    done();
  }
  _final(done: (error?: Error | null) => void) {
    done();
  }
}
