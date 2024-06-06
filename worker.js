import { startTicking, stopTicking } from "./schedulers/index.js";

onmessage = function (e) {
  let { type, method, targetFPS } = e.data;
  if (type === "start") {
    startTicking(
      (elapsed) => {
        postMessage({ type: "update", elapsed });
      },
      targetFPS,
      method
    );
  } else if (type === "stop") {
    stopTicking();
  }
};
