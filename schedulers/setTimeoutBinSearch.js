let waitDelay;
let precision;
let iterations;

function resetValues(ctx) {
  waitDelay = ctx.frameDuration;
  precision = 0.006 * waitDelay;
  iterations = 0;
}

function handleError(expected, actual) {
  iterations += 1;
  let diff = (actual - expected) / iterations;
  waitDelay = waitDelay - diff;
  precision = 0.006 * waitDelay;
  console.log("Overshoot: ", waitDelay, " iterations: ", iterations);
}

export default function (ctx, tick) {
  return {
    start: () => {
      resetValues(ctx);
      ctx.timeoutId = setTimeout(tick, ctx.frameDuration);
    },
    stop: () => {
      clearTimeout(ctx.timeoutId);
    },
    doTick: (elapsed) => {
      if (elapsed <= 0) {
        ctx.timeoutId = setTimeout(tick, Math.max(waitDelay, 0));
        return false;
      }
      if (elapsed > ctx.frameDuration + precision) {
        console.log("Overshot by: ", elapsed - ctx.frameDuration - precision);
        handleError(ctx.frameDuration + precision, elapsed);
        return true;
      }
      if (elapsed > ctx.frameDuration - precision) {
        console.log("Did not overshoot");
        return true;
      }
      console.log("Undershoot by: ", ctx.frameDuration - elapsed);
      handleError(ctx.frameDuration - precision, elapsed);
      let remainingWait = ctx.frameDuration - elapsed;
      ctx.timeoutId = setTimeout(tick, Math.max(remainingWait, 0));
      return false;
    },
    tickCallback: (tickDuration) => {
      let duration = waitDelay - tickDuration;
      ctx.timeoutId = setTimeout(tick, Math.max(duration, 0));
    },
  };
}
