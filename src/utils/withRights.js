module.exports = async (member, handler, permission = "ADMINISTRATOR") => {
  if (!member || !member.hasPermission)
    throw new Error("hasPermission not present on user or user not defined");
  if (!permission) {
    handler();
    return;
  }
  if (member.hasPermission(permission)) handler();
};
