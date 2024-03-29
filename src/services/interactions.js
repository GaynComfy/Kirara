let running = -1;
module.exports = {
  start: async instance => {
    if (running !== -1) return;
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
  stop: async instance => {
    instance.client.ws.removeAllListeners("INTERACTION_CREATE");
    running = -1;
  },
};
