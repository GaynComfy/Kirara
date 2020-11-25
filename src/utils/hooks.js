exports.withRole = async (member, handler, role) => {
  if (!member || !member.roles || !member.roles.cache)
    throw new Error("roles not present on user or user not defined");
  if (!permission) {
    return handler();
  }
  if (member.roles.cache.array().includes(role)) return handler();
};

exports.withRights = async (member, handler, permission = "ADMINISTRATOR") => {
  if (!member || !member.hasPermission)
    throw new Error("hasPermission not present on user or user not defined");
  if (!permission) {
    return handler();
  }
  if (member.hasPermission(permission)) return handler();
  return null;
};
exports.withOwner = async (userId, handler, owners) => {
  if (!userId || !owners)
    throw new Error("owner not present or user not present");

  if (owners.includes(userId)) return handler();
};

exports.withCooldown = async (
  cache,
  id,
  command,
  handler,
  cd = 25,
  returnOnFalse = false
) => {
  if (cd <= 0) {
    await handler();
    return;
  }
  if (await cache.exists(`cmdcooldown:${id}:${command}`)) return;
  const result = await handler();
  if (returnOnFalse === true && result === false) return;
  await cache.setExpire(`cmdcooldown:${id}:${command}`, "1", cd);
};
