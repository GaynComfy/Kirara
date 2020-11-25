const { Client } = require("discord.js");
const database = require("../storage/database");

module.exports = {
  execute: async (instance, params) => {
    for (const server of instance.client.guilds.cache.array()) {
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
      }
    }
  },
  eventName: "ready",
};
