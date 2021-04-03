const isDev = process.env.NODE_ENV === "development";
const { owner } = isDev
  ? require("../config-dev.js")
  : require("../config-prod.js");

exports.withRole = async (member, handler, role) => {
  if (!member || !member.roles || !member.roles.cache)
    throw new Error("roles not present on user or user not defined");
  if (!permission) return handler();
  if (member.roles.cache.array().includes(role)) return handler();

  member
    .send("You are missing a required role for this command.")
    .catch((err) => {});
  return null;
};

exports.withRights = async (member, handler, permission = "ADMINISTRATOR") => {
  if (!member || !member.hasPermission)
    throw new Error("hasPermission not present on user or user not defined");
  if (!permission) return handler();
  if (member.hasPermission(permission) || owner.includes(member.id))
    return handler();

  member
    .send(
      `You are missing a required permission for this command: \`${permission}\``
    )
    .catch((err) => {});
  return null;
};

exports.withOwner = async (userId, handler, owners) => {
  if (!userId || !owners)
    throw new Error("owner not present or user not present");

  if (owners.includes(userId)) return handler();
};

exports.withCooldown = async (
  cache,
  message,
  userId,
  command,
  handler,
  cd = 25,
  returnOnFalse = false
) => {
  if (cd <= 0) return handler();
  if (await cache.exists(`cmdcooldown:${userId}:${command}`)) {
    if (!(await cache.exists(`cmdcooldownw:${userId}:${command}`))) {
      // give them an indicator they need to wait
      message.react("🕘").catch((err) => {});
      await cache.setExpire(`cmdcooldownw:${userId}:${command}`, "1", cd);
    }
    return null;
  }
  const result = await handler();
  if (returnOnFalse === true && result === false) return null;
  if (!owner.includes(userId))
    await cache.setExpire(`cmdcooldown:${userId}:${command}`, "1", cd);
};
