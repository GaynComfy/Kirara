module.exports = {
  execute: async (instance, server) => {
    await instance.database.simpleUpdate(
      "SERVERS",
      {
        guild_id: server.id,
      },
      {
        active: false,
      }
    );
  },
  eventName: "guildDelete",
};
