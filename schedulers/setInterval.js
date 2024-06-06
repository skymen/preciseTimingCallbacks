export default function (ctx, tick) {
  return {
    start: () => {
      ctx.intervalId = setInterval(tick, ctx.frameDuration);
    },
    stop: () => {
      clearInterval(ctx.intervalId);
    },
    doTick: () => true,
    tickCallback: () => {},
  };
}
