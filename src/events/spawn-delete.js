module.exports = {
  execute: async (instance, message) => {
    if (
      message.author.id !== "673362753489993749" &&
      message.author.id !== instance.client.user.id
    ) {
      return;
    }
    if (!instance.shared["spawn"][message.channel.id]) return;
    if (instance.shared["spawnDelete"][message.channel.id].length === 0) return;
    const spawns = instance.shared["spawn"][message.channel.id];

    const s = spawns.find(s => s.message_id === message.id);
    if (!s) return;

    const i = spawns.indexOf(s);
    if (i !== -1) {
      instance.shared["spawn"][message.channel.id][i].despawn = true;
      instance.shared["spawn"][message.channel.id][i].timer = new Date();
      instance.shared["spawnDelete"][message.channel.id].splice(0, 1);
      console.debug(
        `[${instance.client.shard.ids[0]}] T${s.tier} ${s.card_name} despawned on <#${s.channel_id}>`
      );
    }
  },
  eventName: "messageDelete",
};
