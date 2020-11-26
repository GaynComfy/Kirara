module.exports = {
  execute: async (instance, server) => {
    delete instance.serverIds[server.id];
    delete instance.settings[server.id];
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
