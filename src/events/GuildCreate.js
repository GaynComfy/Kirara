module.exports = {
  execute: async (instance, server) => {
    const query = await instance.database.simpleQuery("SERVERS", {
      guild_id: server.id,
    });
    if (query.rows.length === 0) {
      const result = await instance.database.simpleInsert("SERVERS", {
        guild_id: server.id,
        guild_name: server.name,

        owner_id: server.ownerId,
        description: server.description,
        banner: server.banner || null,
        icon: server.icon || null,
        active: true,
        large: server.large,
        log_channel: null,
        timer: false,
      });
      instance.settings[server.id] = {};
      instance.serverIds[server.id] = result.rows[0].id;
      instance.guilds[server.id] = {
        event: false,
        event_time: null,
        log_channel: null,
        timer: false,
      };
    } else {
      instance.serverIds[server.id] = query.rows[0].id;
      instance.guilds[server.id] = {
        event: query.rows[0].event,
        event_time: query.rows[0].event_time,
        log_channel: query.rows[0].log_channel,
        timer: query.rows[0].timer,
      };
      const settings = await instance.database.simpleQuery("SETTINGS", {
        server_id: query.rows[0].id,
      });
      const s = {};
      settings.rows.forEach(element => {
        s[element.key] = element.value;
      });
      instance.settings[server.id] = s;
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
