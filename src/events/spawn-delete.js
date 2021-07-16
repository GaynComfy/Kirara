module.exports = {
  execute: async (instance, message) => {
    if (
      message.author.id !== "673362753489993749" &&
      message.author.id !== instance.client.user.id
    ) {
      return;
    }
    if (!instance.shared["spawn"][message.channel.id]) return;
    const spawns = instance.shared["spawn"][message.channel.id];

    const s = spawns.find(s => s.message_id === message.id);
    if (!s) return;

    const i = spawns.indexOf(s);
    if (i === -1) return;
    const delLen = (instance.shared["spawnDelete"][message.channel.id] || [])
      .length;
    const spawn = instance.shared["spawn"][message.channel.id][i];
    if (delLen > 0) {
      spawn.despawn = true;
      spawn.time = new Date();
      instance.shared["spawnDelete"][message.channel.id].splice(0, 1);
      console.debug(
        `[${instance.client.shard.ids[0]}] T${s.tier} ${s.card_name} despawned on <#${s.channel_id}>`
      );
    } else if (new Date() - spawn.time < 15000) {
      spawn.deleted = true;
      console.debug(
        `[${instance.client.shard.ids[0]}] T${s.tier} ${s.card_name} got deleted on <#${s.channel_id}> without despawning!`
      );
    } else {
      console.error(
        `[${instance.client.shard.ids[0]}] T${s.tier} ${s.card_name} looks to have despawned, but we didn't get the despawn message.. (ignoring)`
      );
    }
  },
  eventName: "messageDelete",
};
