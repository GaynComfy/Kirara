module.exports = {
  execute: async instance => {
    console.log("ready", instance.client.shard.ids[0]);
    for (const server of instance.client.guilds.cache.map(guild => guild)) {
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
        console.log("Adding guild ", server.id, server.name);
      } else {
        const serverObj = query.rows[0];
        instance.serverIds[server.id] = serverObj.id;
        instance.guilds[server.id] = {
          event: serverObj.event,
          event_time: serverObj.event_time,
          log_channel: serverObj.log_channel,
          timer: serverObj.timer,
          prefix: serverObj.prefix,
        };
        // console.log("loading", server.id, server.name);
        const settings = await instance.database.simpleQuery("SETTINGS", {
          server_id: query.rows[0].id,
        });
        const s = {};
        settings.rows.forEach(element => {
          s[element.key] = element.value;
        });
        instance.settings[server.id] = s;
      }
    }
  },
  eventName: "ready",
};
