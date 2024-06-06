import {
  startTicking,
  stopTicking,
  getMethodList,
} from "./schedulers/index.js";

const ctx = document.getElementById("timingChart").getContext("2d");
const timingChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [], // Time (X-Axis)
    datasets: [
      {
        label: "Frame Timing (fps)",
        data: [], // Timing Data (Y-Axis)
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.5,
        cubicInterpolationMode: "monotone",
      },
      {
        label: "Frame Difference (ms)",
        data: [], // Timing Data (Y-Axis)
        fill: false,
        borderColor: "rgb(255, 99, 132)",
        tension: 0.5,
        cubicInterpolationMode: "monotone",
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    animation: {
      duration: 0,
    },
    plugins: {
      annotation: {
        annotations: {
          line1: {
            type: "line",
            yMin: 60,
            yMax: 60,
            borderColor: "rgb(255, 99, 132)",
            borderWidth: 2,
          },
        },
      },
    },
  },
});

let updateGraphEvery = parseInt(
  document.getElementById("updateGraphEvery").value
);

document.getElementById("updateGraphEvery").addEventListener("input", (e) => {
  updateGraphEvery = parseInt(e.target.value);
});

let methodSelector = document.getElementById("methodSelector");
let methods = getMethodList();
for (let i = 0; i < methods.length; i++) {
  let option = document.createElement("option");
  option.value = methods[i];
  option.text = methods[i];
  methodSelector.appendChild(option);
}
methodSelector.value = methods[0];

let curUpdate = 0;
const minDelayElement = document.getElementById("minDelay");
const maxDelayElement = document.getElementById("maxDelay");
const avgDelayElement = document.getElementById("avgDelay");
const lastDelayElement = document.getElementById("lastDelay");
const minFpsElement = document.getElementById("minFps");
const maxFpsElement = document.getElementById("maxFps");
const avgFpsElement = document.getElementById("avgFps");
const lastFpsElement = document.getElementById("lastFps");

let isFirstUpdatePostRestart = true;

let minDelay = Infinity;
let maxDelay = 0;
let avgDelay = 0;
let delayLerp = 0.1;

let minFps = Infinity;
let maxFps = 0;
let avgFps = 0;
let fpsLerp = 0.1;

const resetMetrics = () => {
  minDelay = Infinity;
  maxDelay = 0;
  avgDelay = 0;
  minFps = Infinity;
  maxFps = 0;
  avgFps = 0;
  minDelayElement.textContent = "0";
  maxDelayElement.textContent = "0";
  avgDelayElement.textContent = "0";
  lastDelayElement.textContent = "0";

  minFpsElement.textContent = "0";
  maxFpsElement.textContent = "0";
  avgFpsElement.textContent = "0";
  lastFpsElement.textContent = "0";
};

const updateMetrics = (delay, fps) => {
  if (isFirstUpdatePostRestart) {
    resetMetrics();
    isFirstUpdatePostRestart = false;
  }
  if (delay < minDelay) minDelay = delay;
  if (delay > maxDelay) maxDelay = delay;
  avgDelay = (1 - delayLerp) * avgDelay + delayLerp * delay;

  if (fps < minFps) minFps = fps;
  if (fps > maxFps) maxFps = fps;
  avgFps = (1 - fpsLerp) * avgFps + fpsLerp * fps;

  minDelayElement.textContent = minDelay.toFixed(2);
  maxDelayElement.textContent = maxDelay.toFixed(2);
  avgDelayElement.textContent = avgDelay.toFixed(2);
  lastDelayElement.textContent = delay.toFixed(2);

  minFpsElement.textContent = minFps.toFixed(2);
  maxFpsElement.textContent = maxFps.toFixed(2);
  avgFpsElement.textContent = avgFps.toFixed(2);
  lastFpsElement.textContent = fps.toFixed(2);
};

const updateGraph = (elapsed) => {
  curUpdate++;
  const fps = 1000 / elapsed;
  const difference =
    elapsed - 1000 / parseInt(document.getElementById("targetFPS").value);
  updateMetrics(difference, fps);
  const chartLength = 30;
  if (timingChart.data.labels.length < chartLength) {
    for (let i = 0; i < chartLength - timingChart.data.labels.length; i++) {
      timingChart.data.labels.push("");
      timingChart.data.datasets[0].data.push(0);
      timingChart.data.datasets[1].data.push(0);
    }
  }
  for (let i = 0; i < timingChart.data.labels.length - 1; i++) {
    timingChart.data.labels[i] = timingChart.data.labels[i + 1];
    timingChart.data.datasets[0].data[i] =
      timingChart.data.datasets[0].data[i + 1];
    timingChart.data.datasets[1].data[i] =
      timingChart.data.datasets[1].data[i + 1];
  }
  timingChart.data.labels[timingChart.data.labels.length - 1] = "";
  timingChart.data.datasets[0].data[
    timingChart.data.datasets[0].data.length - 1
  ] = fps;
  timingChart.data.datasets[1].data[
    timingChart.data.datasets[1].data.length - 1
  ] = difference;
  if (curUpdate >= updateGraphEvery) {
    curUpdate = 0;
    timingChart.update();
  }
};

const worker = new Worker("worker.js", { type: "module" });

worker.onmessage = function (e) {
  if (e.data.type === "update") {
    updateGraph(e.data.elapsed);
  }
};

const stopMethod = () => {
  worker.postMessage({ type: "stop" });
  stopTicking();
};

const startMethod = () => {
  isFirstUpdatePostRestart = true;
  let useWorker = document.getElementById("useWorker").checked;
  let targetFPS = parseInt(document.getElementById("targetFPS").value);
  let method = document.getElementById("methodSelector").value;
  if (useWorker) {
    worker.postMessage({ type: "start", method, targetFPS });
  } else {
    startTicking(updateGraph, targetFPS, method);
  }
};

const restartScheduler = () => {
  resetMetrics();
  //update horizontal line
  let targetFPS = parseInt(document.getElementById("targetFPS").value);
  timingChart.options.plugins.annotation.annotations.line1.yMax = targetFPS;
  timingChart.options.plugins.annotation.annotations.line1.yMin = targetFPS;
  stopMethod();
  startMethod();
};

document
  .getElementById("methodSelector")
  .addEventListener("change", restartScheduler);

document
  .getElementById("useWorker")
  .addEventListener("change", restartScheduler);

document
  .getElementById("targetFPS")
  .addEventListener("change", restartScheduler);
// Initial call
restartScheduler();
