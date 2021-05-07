const { runGame } = require("../../utils/Trivia");
const info = {
  name: "trivia",
  category: "Trivia",
  guilds: ["378599231583289346"],
  matchCase: false,
};

const startQueue = {};

module.exports = {
  execute: async (instance, message, args) => {
    const existing = instance.trivia[message.guild.id];

    if (startQueue[message.guild.id] || (existing && existing.running)) {
      // TODO return message
      return true;
    }
    const opts = { interval: 30000, amount: 5, jointime: 60000 };
    for (const arg of args) {
      if (arg.startsWith("interval")) {
        const interval = arg.split("=")[1];
        if (Number.isNaN(interval)) return false;
        opts.interval = Number.parseInt(interval * 1000);
      } else if (arg.startsWith("amount")) {
        const amount = arg.split("=")[1];
        if (Number.isNaN(amount)) return false;
        opts.amount = Number.parseInt(amount);
      } else if (arg.startsWith("jointime")) {
        const amount = arg.split("=")[1];
        if (Number.isNaN(amount)) return false;
        opts.jointime = Number.parseInt(amount * 1000);
      }
    }
    startQueue[message.guild.id] = true;
    const participants = {};

    const collectorMessage = await message.channel.send(
      "React here to participate in the quiz within 60 seconds"
    );

    const collector = collectorMessage.createReactionCollector(
      (reaction, user) => reaction.emoji.name == "✅" && !user.bot,
      { time: opts.jointime }
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
      runGame(instance, message.channel, message.guild, participants, opts);
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
