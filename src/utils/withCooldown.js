module.exports = async (cache, id, command, handler, cd = 25) => {
  if (cd <= 0) {
    await handler();
    return;
  }
  if (await cache.exists(`cmdcooldown:${id}:${command}`)) return;
  await handler();
  await cache.setExpire(`cmdcooldown:${id}:${command}`, "1", cd);
};
