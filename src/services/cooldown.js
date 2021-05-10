const { MessageEmbed } = require("discord.js");

let notifyInterval = null;

module.exports = {
  start: async instance => {
    if (!instance.shared["cooldown"]) instance.shared["cooldown"] = {};

    notifyInterval = setInterval(async () => {
      Object.keys(instance.shared["cooldown"]).forEach(chan => {
        if (instance.shared["cooldown"][chan].time < 110000) return;

        const embed = new MessageEmbed()
          .setColor("RANDOM")
          .setDescription(
            "> <:Sirona_yesh:762603569538531328> Spawn cooldown reset!"
          );

        instance.shared["cooldown"][chan]
          .send(embed)
          .catch(err => console.error(err));
        delete instance.shared["cooldown"][chan];
      });
    }, 1000);
  },
  stop: async () => {
    if (notifyInterval) clearInterval(notifyInterval);
  },
};
