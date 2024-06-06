let differences = [];
let maxDifferences;
let maxListen;
let listenFor;
let avgDifference;

function newListenCycle() {
  differences.length = 0;
  listenFor = 0;
}

function resetDifferences(ctx) {
  newListenCycle();
  avgDifference = 0;
  maxDifferences = Math.floor(ctx.targetFPS / 2);
  maxListen = ctx.targetFPS;
}

function pushDifference(diff) {
  if (listenFor > maxListen) return;
  listenFor++;
  if (differences.length >= maxDifferences) {
    differences.shift();
  }
  differences.push(diff);
  if (listenFor === maxListen) {
    avgDifference = differences.reduce((a, b) => a + b) / differences.length;
    newListenCycle();
  }
}

export default function (ctx, tick) {
  return {
    start: () => {
      resetDifferences(ctx);
      ctx.timeoutId = setTimeout(tick, ctx.frameDuration);
    },
    stop: () => {
      clearTimeout(ctx.timeoutId);
    },
    doTick: (elapsed) => {
      pushDifference(elapsed - ctx.frameDuration + avgDifference);
      return true;
    },
    tickCallback: (tickDuration) => {
      let duration = ctx.frameDuration - avgDifference - tickDuration;
      ctx.timeoutId = setTimeout(tick, Math.max(duration, 0));
    },
  };
}
