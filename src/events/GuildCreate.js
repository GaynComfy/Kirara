module.exports = {
  execute: async (instance, server) => {
    const query = await instance.database.simpleQuery("SERVERS", {
      guild_id: server.id,
    });
    if (query.rows.length === 0) {
      instance.database.simpleInsert("SERVERS", {
        guild_id: server.id,
        owner_id: server.ownerID,
        description: server.description,
        banner: server.banner || null,
        icon: server.icon || null,
        active: true,
        large: server.large,
        log_channel: null,
      });
    } else {
      await instance.database.simpleUpdate(
        "SERVERS",
        {
          guild_id: server.id,
        },
        {
          active: true,
        }
      );
    }
  },
  eventName: "guildCreate",
};
