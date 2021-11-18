const { runGame } = require("../../utils/Trivia");
const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");
const info = {
  name: "trivia",
  category: "UwU",
  guilds: ["378599231583289346"],
  matchCase: false,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  disabled: process.env.NODE_ENV !== "development",
};

const noUsersEmbed = new MessageEmbed()
  .setColor("#dd3333")
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> Not enough participants - cancelling quiz!"
  );
const alreadyRunning = new MessageEmbed()
  .setColor("#dd3333")
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> There is an already running quiz on this server."
  );

const startQueue = {};

module.exports = {
  execute: async (instance, message, args) =>
    // ToDo: Change withRights with something more appropriate.
    // For now, while we use this on Gay & Comfy, should do the trick.
    withRights(
      message.member,
      async () => {
        message.delete().catch(() => {});

        const existing = instance.trivia[message.guild.id];
        if (startQueue[message.guild.id] || (existing && existing.running)) {
          return message.author.send(alreadyRunning).catch(() => {});
        }

        const opts = {
          interval: 30000,
          amount: 5,
          jointime: 60000,
          source: message,
        };
        for (const arg of args) {
          // ToDo: Change this for a switch case?
          // ToDo: Add `questions` argument.
          if (arg.startsWith("interval")) {
            const interval = arg.split("=")[1];
            if (
              Number.isNaN(interval) ||
              Number.parseInt(interval) >= 120 ||
              Number.parseInt(interval) <= 0
            )
              return false;
            opts.interval = Number.parseInt(interval * 1000);
          } else if (arg.startsWith("amount")) {
            const amount = arg.split("=")[1];
            if (Number.isNaN(amount)) return false;
            opts.amount = Number.parseInt(amount);
          } else if (arg.startsWith("jointime")) {
            const amount = arg.split("=")[1];
            if (
              Number.isNaN(amount) ||
              Number.parseInt(amount) >= 120 ||
              Number.parseInt(amount) <= 0
            )
              return false;
            opts.jointime = Number.parseInt(amount * 1000);
          }
        }
        startQueue[message.guild.id] = true;
        const participants = {};

        const embed = new MessageEmbed()
          .setColor("#ddaaaa")
          .setTitle("A new quiz is starting!")
          .setDescription("React ✅ to join!")
          .setFooter(
            `Be fast! You can join within ${opts.jointime / 1000} seconds`
          );

        const collectorMessage = await message.channel.send({
          embeds: [embed],
        });

        const filter = (reaction, user) =>
          reaction.emoji.name == "✅" && !user.bot;
        const collector = collectorMessage.createReactionCollector({
          filter,
          time: opts.jointime,
        });
        collector.on("collect", (r, user) => {
          if (!participants[user.id])
            participants[user.id] = { id: user.id, name: user.username };
        });
        collector.on("end", () => {
          delete startQueue[message.guild.id];
          if (Object.keys(participants).length < 1) {
            return collectorMessage.edit({ embeds: [noUsersEmbed] });
          }
          return runGame(
            instance,
            message.channel,
            message.guild,
            participants,
            opts
          );
        });

        await collectorMessage.react("✅").catch(err => console.error(err));
        return collector;
      },
      "MANAGE_MESSAGES"
    ),
  info,
  help: {
    usage: "trivia [interval=<secs>] [amount=<questions>] [jointime=<secs>]",
    examples: ["trivia", "trivia interval=30 amount=5 jointime=60"],
    description: "Start a trivia game! (A minimum of 2 players is required)",
  },
};
