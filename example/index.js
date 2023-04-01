import { WorkerClient } from "./channel.js";

// STANDARD, EVENT-DRIVEN API

const worker = new Worker("./worker.js", { type: "module" });
const syncLog = document.getElementById("sync-log");

// Register message event listener
worker.addEventListener("message", (e) => {
  const text = new Text(`${e.timeStamp.toFixed(2)}: ${e.data}\n`);
  syncLog.appendChild(text);
});

// Fire events at the worker
const pingButton = document.getElementById("ping");
pingButton.addEventListener("click", () => {
  worker.postMessage("ping");
});

////////////////////////////////////////////////////////////////////////////

// ASYNC WRAPPED API

const client = new WorkerClient("./worker.js");
const asyncLog = document.getElementById("async-log");

const form = document.getElementById("form");
form.onsubmit = async (e) => {
  e.preventDefault();
  try {
    const data = await client.post(e.target.elements.num.valueAsNumber);
    const text = new Text(`${e.timeStamp.toFixed(2)}: ${data}\n`);
    asyncLog.appendChild(text);
  } catch (error) {
    console.error(error);
    const p = document.createElement("p");
    p.style.color = "red";
    p.innerText = `${e.timeStamp.toFixed(2)}: ${error.message}\n`;
    asyncLog.appendChild(p);
  }
};
