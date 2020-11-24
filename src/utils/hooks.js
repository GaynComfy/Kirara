exports.withRole = async (member, handler, role) => {
  if (!member || !member.roles || !member.roles.cache)
    throw new Error("roles not present on user or user not defined");
  if (!permission) {
    handler();
    return;
  }
  if (member.roles.cache.array().includes(role)) handler();
};

exports.withRights = async (member, handler, permission = "ADMINISTRATOR") => {
  if (!member || !member.hasPermission)
    throw new Error("hasPermission not present on user or user not defined");
  if (!permission) {
    handler();
    return;
  }
  if (member.hasPermission(permission)) handler();
};

exports.withCooldown = async (cache, id, command, handler, cd = 25) => {
  if (cd <= 0) {
    await handler();
    return;
  }
  if (await cache.exists(`cmdcooldown:${id}:${command}`)) return;
  await handler();
  await cache.setExpire(`cmdcooldown:${id}:${command}`, "1", cd);
};
