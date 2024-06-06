import methodRaf from "./raf.js";
import methodSetInterval from "./setInterval.js";
import methodSetTimeout from "./setTimeout.js";
import methodSetTimeoutRebalanced from "./setTimeoutRebalanced.js";
import methodSetTimeoutEMA from "./setTimeoutEMA.js";
import methodSetTimeoutBinSearch from "./setTimeoutBinSearch.js";
import methodSetTimeoutWhileLoop from "./setTimeoutWhileLoop.js";

let tickCallback;
let lastTime;
let methodContext = {};
let methods = {
  raf: methodRaf(methodContext, tick),
  setInterval: methodSetInterval(methodContext, tick),
  setTimeout: methodSetTimeout(methodContext, tick),
  setTimeoutRebalanced: methodSetTimeoutRebalanced(methodContext, tick),
  setTimeoutEMA: methodSetTimeoutEMA(methodContext, tick),
  setTimeoutBinSearch: methodSetTimeoutBinSearch(methodContext, tick),
  setTimeoutWhileLoop: methodSetTimeoutWhileLoop(methodContext, tick),
  pause: {
    stop: () => {},
    start: () => {},
    doTick: () => false,
    tickCallback: () => {},
  },
};
let currentMethodId = "raf";
function getCurrentMethod(methodId) {
  if (methodId) {
    currentMethodId = methodId;
  }
  return methods[currentMethodId];
}

export function getMethodList() {
  return Object.keys(methods);
}

function updateTargetFps(targetFPS) {
  methodContext.frameDuration = 1000 / targetFPS;
  methodContext.targetFPS = targetFPS;
}

export function stopTicking() {
  let curMethod = getCurrentMethod();
  curMethod.stop();
  tickCallback = () => {};
  curMethod = methods.pause;
}

export function startTicking(callback, targetFPS, methodId) {
  let curMethod = getCurrentMethod();
  curMethod.stop();
  updateTargetFps(targetFPS);
  tickCallback = callback;
  curMethod = getCurrentMethod(methodId);
  lastTime = performance.now();
  curMethod.start();
}

function tick() {
  let now = performance.now();
  let elapsed = now - lastTime;
  let scheduler = getCurrentMethod();
  if (scheduler.doTick(elapsed)) {
    let now2 = performance.now();
    elapsed = now2 - lastTime;
    lastTime = now2;
    tickCallback(elapsed);
    let tickDuration = performance.now() - now;
    scheduler.tickCallback(tickDuration);
  }
}

const verbose = false;
if (!verbose) {
  console.log = () => {};
  console.group = () => {};
  console.groupEnd = () => {};
  console.warn = () => {};
  console.error = () => {};
}
