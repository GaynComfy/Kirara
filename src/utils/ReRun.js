const EXPIRE_TIME = 60 * 60 * 2;
const save = async (instance, command, message, args) => {
  const redisKey = `command_cache:${message.author.id}`;
  const data = {
    command: command.info.name,
    content: message.content,
    args: args || [],
  };
  await instance.cache.setExpire(redisKey, JSON.stringify(data), EXPIRE_TIME);
};
const get = async (instance, id) => {
  const redisKey = `command_cache:${id}`;
  const value = await instance.cache.get(redisKey);
  if (!value) return null;
  return JSON.parse(value);
};
const del = async (instance, id) => {
  const redisKey = `command_cache:${id}`;
  await instance.cache.delete(redisKey);
};
module.exports = {
  save,
  get,
  del,
};
