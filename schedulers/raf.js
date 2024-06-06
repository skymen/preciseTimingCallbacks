export default function (ctx, tick) {
  return {
    start: () => {
      ctx.requestId = requestAnimationFrame(tick);
    },
    stop: () => {
      cancelAnimationFrame(ctx.requestId);
    },
    doTick: (elapsed) => {
      if (elapsed < ctx.frameDuration) {
        ctx.requestId = requestAnimationFrame(tick);
        return false;
      }
      return true;
    },
    tickCallback: () => {
      ctx.requestId = requestAnimationFrame(tick);
    },
  };
}
