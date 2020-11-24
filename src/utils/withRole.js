module.exports = async (member, handler, role) => {
  if (!member || !member.roles || !member.roles.cache)
    throw new Error("roles not present on user or user not defined");
  if (!permission) {
    handler();
    return;
  }
  if (member.roles.cache.array().includes(role)) handler();
};
