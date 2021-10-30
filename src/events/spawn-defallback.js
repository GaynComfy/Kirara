// Tracks despawns as they happen lively on Shoob.
const hasDespawned = "Looks like nobody got the dropped card this time.";

const processDespawn = async (instance, message) => {
  if (!instance.shared["spawn"][message.channel.id]) return;
  const spawns = instance.shared["spawn"][message.channel.id];

  const spawn = spawns.find(s => s.message_id === message.id);
  if (!spawn)
    return console.error(
      `!A card despawned (${message.id}), but I couldn't find it on cache.`
    );

  const i = spawns.indexOf(spawn);
  if (i === -1) return; // oh fuck
  const s = spawns[i];

  s.despawn = true;
  s.time = new Date();
};

module.exports = {
  execute: async (instance, _, message) => {
    if (
      message.author.id !== "673362753489993749" &&
      message.author.id !== instance.client.user.id
    ) {
      return;
    }
    for (const embed of message.embeds) {
      if (embed.description === hasDespawned) {
        await processDespawn(instance, message);
      }
    }
  },
  eventName: "messageUpdate",
};
