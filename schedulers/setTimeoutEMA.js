let alpha = 0.15; // Smoothing factor for EMA
let emaDifference;
let maxEMADifferences;
let emaDifferences;
let curEMADifference;

function resetEMA(ctx) {
  emaDifference = 0;
  maxEMADifferences = ctx.targetFPS;
  emaDifferences = new Array(maxEMADifferences).fill(0);
  curEMADifference = 0;
}

function updateEMA(diff) {
  emaDifference = emaDifferences[curEMADifference];
  emaDifference = alpha * diff + (1 - alpha) * emaDifference;
  emaDifferences[curEMADifference] = emaDifference;
  curEMADifference = (curEMADifference + 1) % maxEMADifferences;
}

export default function (ctx, tick) {
  return {
    start: () => {
      resetEMA(ctx);
      ctx.timeoutId = setTimeout(tick, ctx.frameDuration);
    },
    stop: () => {
      clearTimeout(ctx.timeoutId);
    },
    doTick: (elapsed) => {
      updateEMA(elapsed - ctx.frameDuration + emaDifference);
      return true;
    },
    tickCallback: (tickDuration) => {
      let duration = ctx.frameDuration - emaDifference - tickDuration;
      ctx.timeoutId = setTimeout(tick, Math.max(duration, 0));
    },
  };
}
