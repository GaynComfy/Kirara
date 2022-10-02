const { withOwner } = require("../../utils/hooks");
const { mention } = require("../../utils/regexUtils");
const { MessageCollector } = require("discord.js");
const { getMarriage } = require("../Roleplay/utils");

const authorized = ["189978735816998913", "175408504427905025"];

const info = {
  name: "forcemarry",
  aliases: ["fmarry"],
  matchCase: false,
  category: "Owner",
};

module.exports = {
  execute: async (instance, message, args) =>
    withOwner(
      message.author.id,
      async () => {
        if (!authorized.includes(message.author.id)) return;
        if (
          message.mentions.users.size < 2 &&
          !mention.test(args[0] || "") &&
          !mention.test(args[1] || "")
        )
          return false;
        const asker = message.mentions.members.first();
        const asking = message.mentions.members.last();

        const marry = await getMarriage(instance, asker.id, true);
        if (marry.find(m => m.user === asking.id)) {
          await message.reply(
            "They are already married! Is it hard for you to check up their marriage status?"
          );
          return;
        }

        const msg = await message.channel.send(
          `Are you sure you want to force marry <@${asker.id}> and <@${asking.id}>?\n` +
            "Type `yes` to accept, or `no` to decline!\n\n" +
            "> *You have one minute to reply!*"
        );
        const filter = async m => m.author.id === message.author.id;
        const collector = new MessageCollector(message.channel, {
          filter,
          time: 60000,
        });
        collector.on("collect", async m => {
          if (m.content.toLowerCase() === "yes") {
            collector.stop("final");
            await instance.database.simpleInsert("MARRIAGE", {
              asker: asker.id,
              married: asking.id,
              date_added: new Date(),
            });
            await m.reply(
              `<@${asker.id}> and <@${asking.id}> are now married because the evil gods have said so!`
            );
            collector.stop("final");
            return;
          } else if (m.content.toLowerCase() === "no") {
            collector.stop("final");
            await m.reply(
              `Mercy has been given, and the gods have decided not to force marriage upon <@${asker.id}> and <@${asking.id}>!`
            );
            return;
          }
        });
        collector.on("end", async () => {
          if (collector.endReason !== "final") {
            await msg.reply(
              `My message seems to have been ignored! <@${asker.id}> and <@${asking.id}> are not being forced to marry!`
            );
          }
        });
      },
      instance.config.owner
    ),
  info,
  help: {
    usage: "forcemarry <@user> <@user>",
    examples: ["forcemarry @cass @cass"],
    description: "Forces a user to marry another user",
  },
};
