let running = false;
// I think this will be broken with the Discord.js v14 update.
module.exports = {
  start: async instance => {
    if (running !== false) return;
    const date = Date.now();
    running = date;

    instance.client.ws.on("INTERACTION_CREATE", async interaction => {
      if (running !== date) return;
      if (instance.trivia[interaction.guild_id]) {
        const entry = instance.trivia[interaction.guild_id];
        if (entry.running && entry.slashName == interaction.data.name)
          return entry.onInteraction(interaction);
      }
    });
  },
  stop: async () => {
    running = false;
  },
};
