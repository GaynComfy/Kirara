const isDev = process.env.NODE_ENV === "development";
const { owner } = isDev
  ? require("../config-dev.js")
  : require("../config-prod.js");

exports.withRole = async (member, handler, role) => {
  if (!member || !member.roles || !member.roles.cache)
    throw new Error("roles not present on user or user not defined");
  if (!role) return handler();
  if (member.roles.cache.array().includes(role)) return handler();

  member
    .send(`You are missing a required role for this command: \`${role.name}\`.`)
    .catch(() => {});
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
    .catch(() => {});
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
  command,
  handler,
  cd = 25,
  returnOnFalse = false
) => {
  if (cd <= 0) return handler();
  const cdKey = `cmdcooldown:${message.channel.id}:${message.author.id}:${command}`;
  const cdReactKey = `cmdcooldownw:${message.channel.id}:${message.author.id}:${command}`;

  // are we in cooldown?
  if (await cache.exists(cdKey)) {
    // have we indicated the user that they are if so?
    if (!(await cache.exists(cdReactKey))) {
      // give them an indicator they need to wait
      message.react("🕘").catch(() => {});
      await cache.setExpire(cdReactKey, "1", 5);
    }
    return null;
  }

  const result = await handler();
  if (returnOnFalse === true && result === false) return false;
  if (!owner.includes(message.author.id)) await cache.setExpire(cdKey, "1", cd);
  return result;
};

exports.verifyPerms = async (instance, message, perms) => {
  if (!message.guild || !perms || perms.length <= 0) return true;

  const member = message.guild.member(instance.client.user);
  if (!member) return true; // ???
  const missing = perms.filter(p => !member.hasPermission(p));
  const prefix =
    instance.guilds[message.guild.id].prefix || instance.config.prefix;

  if (missing.length > 0) {
    const isAdmin = message.member.hasPermission("ADMINISTRATOR");
    const canSendMessages = member.hasPermission("SEND_MESSAGES");
    let target = message.channel;
    if (!canSendMessages) target = message.author;

    target.send(
      (canSendMessages
        ? "I'm sorry, but I can't execute that command!"
        : `You just tried executing a command on <#${message.channel.id}>, but I can't since`) +
        " I am missing permissions to do what's required for it! To be exact:\n```diff\n- " +
        missing.join("\n- ") +
        "```\n" +
        (isAdmin
          ? `To make sure I have all the permissions, please use \`${prefix}invite\` to invite me back to the server!`
          : !canSendMessages
          ? "Please ask the server's admins for assistance."
          : "")
    );
    return false;
  }

  return true;
};
