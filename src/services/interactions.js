let running = true;
module.exports = {
  start: async instance => {
    instance.client.ws.on("INTERACTION_CREATE", async interaction => {
      if (!running) return;
      if (instance.trivia[interaction.guild_id]) {
        const entry = instance.trivia[interaction.guild_id];
        if (entry.running && entry.slashName == interaction.data.name)
          entry.onInteraction(interaction);
      }
    });
  },
  stop: async () => {
    running = false;
  },
};
