const DEFAULT_CHANNEL = "__worker_channel";
const DEFAULT_WORKER_OPTIONS = { type: "module" };

/**
 * A client for interacting with a Web Worker via async requests.
 */
export class WorkerClient {
  #channel;
  #worker;
  #receiver;
  #pending = new Map();

  constructor(
    workerUrl,
    options = DEFAULT_WORKER_OPTIONS,
    channel = DEFAULT_CHANNEL
  ) {
    this.#channel = channel;
    this.#worker = new Worker(workerUrl, options);
    this.#receiver = (event) => {
      if (!event.data || !event.data.id) return;
      if (event.data.channel !== this.#channel) return;
      if (!this.#pending.has(event.data.id)) return;

      const [resolve, reject] = this.#pending.get(event.data.id);
      if ("payload" in event.data) {
        resolve(event.data.payload);
      } else if ("error" in event.data) {
        reject(event.data.error);
      } else {
        reject(new Error("Malformed response"));
      }
      this.#pending.delete(event.data.id);
    };

    this.#worker.addEventListener("message", this.#receiver);
  }

  async post(payload) {
    const id = Math.floor(Math.random() * 1_000_000)
      .toString(16)
      .padStart(6, "0");

    return new Promise((resolve, reject) => {
      this.#pending.set(id, [resolve, reject]);

      const data = {
        id,
        channel: this.#channel,
        payload,
      };

      this.#worker.postMessage(data);
    });
  }
}

/**
 * A Worker-based channel for communicating with a main-thread WorkerClient.
 */
export class WorkerHost {
  #channel;
  #receivers = new Map();

  constructor(channel = DEFAULT_CHANNEL) {
    this.#channel = channel;
  }

  on(callback) {
    const wrapper = async (event) => {
      if (
        !event.data ||
        !event.data.id ||
        event.data.channel !== this.#channel
      ) {
        return;
      }

      try {
        const payload = await callback(event);
        const data = {
          id: event.data.id,
          channel: this.#channel,
          payload,
        };

        postMessage(data);
      } catch (error) {
        const data = {
          id: event.data.id,
          channel: this.#channel,
          error,
        };

        postMessage(data);
      }
    };

    this.#receivers.set(callback, wrapper);
    addEventListener("message", wrapper);
  }

  off(callback) {
    const wrapper = this.#receivers.get(callback);
    if (wrapper) {
      removeEventListener("message", wrapper);
      this.#receivers.delete(callback);
    }
  }
}
