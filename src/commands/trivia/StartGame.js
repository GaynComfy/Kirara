const { runGame } = require("../../utils/Trivia");
const info = {
  name: "trivia",
  category: "Trivia",
  guilds: ["378599231583289346"],
  matchCase: false,
};

const startQueue = {};

module.exports = {
  execute: async (instance, message /*args*/) => {
    const existing = instance.trivia[message.guild.id];

    if (startQueue[message.guild.id] || (existing && existing.running)) {
      // TODO return message
      return true;
    }
    startQueue[message.guild.id] = true;
    const participants = {};

    const collectorMessage = await message.channel.send(
      "React here to participate in the quiz within 60 seconds"
    );

    const collector = collectorMessage.createReactionCollector(
      (reaction, user) => reaction.emoji.name == "✅" && !user.bot,
      { time: 60000 }
    );
    await collectorMessage.react("✅");

    collector.on("collect", (reaction, user) => {
      if (!participants[user.id])
        participants[user.id] = { id: user.id, name: user.username };
    });

    collector.on("end", () => {
      delete startQueue[message.guild.id];
      if (Object.keys(participants).length === 0) {
        message.channel.send("No users, not starting");
        return;
      }
      runGame(instance, message.channel, message.guild, participants, {});
    });

    return true;
  },
  info,
  help: {
    usage: "trivia start",
    examples: ["trivia start"],
    description: "Start a trivia game",
  },
};
