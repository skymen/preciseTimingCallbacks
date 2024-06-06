let maxLoops = 1024;
let realMaxLoops = 32768 * 2 * 2;
let waitDelay;
let precision;
let precisionRatio = 0.006;
let ignoreNext = false;
let instantTick = false;

function resetValues(ctx) {
  waitDelay = ctx.frameDuration;
  precision = precisionRatio * ctx.frameDuration;
  maxLoops = 2;
}

function hangWhileLoopFor(duration) {
  let now = performance.now();
  let start = now;
  let nbLoops = 0;
  while (now - start < duration && nbLoops < maxLoops) {
    now = performance.now();
    nbLoops++;
  }
  return nbLoops === maxLoops;
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
      if (ignoreNext) return true;
      let doTickStart = performance.now();
      console.group("Elapsed: " + elapsed);
      console.log("Expected", ctx.frameDuration, "Precision", precision);
      if (elapsed <= 0) {
        console.error("Elapsed is negative???");
        console.groupEnd();
        return true;
      }
      if (elapsed > ctx.frameDuration - precision) {
        let overshotBy = elapsed - ctx.frameDuration + precision;
        waitDelay = waitDelay - Math.max(overshotBy / 70, 0);
        console.warn("Overshot by: ", overshotBy);
        console.groupEnd();
        return true;
      }
      // instantTick = true;
      let start = performance.now();
      let hangFor = ctx.frameDuration - elapsed - (start - doTickStart);
      if (hangWhileLoopFor(hangFor) && maxLoops < realMaxLoops) {
        maxLoops = Math.min(maxLoops * 2, realMaxLoops);
        console.error("Max loops reached: ", maxLoops);
        console.groupEnd();
        return true;
      }
      let hangDuration = performance.now() - start;
      console.log("hang for: ", hangFor);
      console.log("Hung for: ", hangDuration);
      console.log("Did not overshoot");
      console.groupEnd();
      return true;
    },
    tickCallback: (tickDuration) => {
      if (instantTick) {
        instantTick = false;
        tick();
        return;
      }
      let duration = waitDelay - tickDuration;
      if (duration < 0) duration = ctx.frameDuration;
      console.log("Tick: ", duration);
      ignoreNext = false;
      ctx.timeoutId = setTimeout(tick, Math.max(duration, 0));
    },
  };
}
