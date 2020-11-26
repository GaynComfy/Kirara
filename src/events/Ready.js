const { Client } = require("discord.js");
const database = require("../storage/database");

module.exports = {
  execute: async (instance, params) => {
    for (const server of instance.client.guilds.cache.array()) {
      const query = await instance.database.simpleQuery("SERVERS", {
        guild_id: server.id,
      });
      if (query.rows.length === 0) {
        const result = await instance.database.simpleInsert("SERVERS", {
          guild_id: server.id,
          guild_name: server.name,
          owner_id: server.ownerID,
          description: server.description,
          banner: server.banner || null,
          icon: server.icon || null,
          active: true,
          large: server.large,
          log_channel: null,
        });
        instance.settings[server.id] = {};
        instance.serverIds[server.id] = result.rows[0].id;
      } else {
        const serverObj = query.rows[0];
        instance.serverIds[server.id] = serverObj.id;
        if (serverObj.log_channel)
          instance.logChannels[server.id] = serverObj.log_channel;

        const settings = await instance.database.simpleQuery("SETTINGS", {
          server_id: query.rows[0].id,
        });
        const s = {};
        settings.rows.forEach((element) => {
          s[element.key] = element.value;
        });
        instance.settings[server.id] = s;
      }
    }
  },
  eventName: "ready",
};
