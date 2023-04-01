import { WorkerHost } from "./channel.js";

self.onmessage = (e) => {
  if (e.data === "ping") {
    postMessage("pong");
  }
};

const host = new WorkerHost();
host.on(async (event) => {
  if (typeof event.data.payload === "number") {
    if (event.data.payload > 0 && event.data.payload % 7 === 0) {
      throw new Error("No multiples of 7 allowed");
    }

    return event.data.payload * 2;
  }
});
