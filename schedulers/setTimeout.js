export default function (ctx, tick) {
  return {
    start: () => {
      ctx.timeoutId = setTimeout(tick, ctx.frameDuration);
    },
    stop: () => {
      clearTimeout(ctx.timeoutId);
    },
    doTick: () => true,
    tickCallback: (tickDuration) => {
      let duration = ctx.frameDuration - tickDuration;
      ctx.timeoutId = setTimeout(tick, Math.max(duration, 0));
    },
  };
}
