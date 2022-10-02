const { withOwner } = require("../../utils/hooks");
const { MessageCollector } = require("discord.js");
const { getMarriage } = require("../Roleplay/utils");

const authorized = ["189978735816998913", "175408504427905025"];

const info = {
  name: "forcedivorce",
  aliases: ["fdivorce"],
  matchCase: false,
  category: "Owner",
};

module.exports = {
  execute: async (instance, message) =>
    withOwner(
      message.author.id,
      async () => {
        if (!authorized.includes(message.author.id)) return;
        if (message.mentions.users.size === 0) return;
        const asker = message.mentions.members.first();
        if (asker.id === message.author.id) {
          await message.reply("Use the divorce command yourself, clown.");
          return;
        }
        const marry = await getMarriage(instance, asker.id, true);
        if (marry.length === 0) {
          await message.reply(
            "They are not married! Get your notes straight, god."
          );
          return;
        }
        const marriage = marry[0];

        const msg = await message.channel.send(
          `Are you sure you want to force divorce <@!${asker.id}> with <@!${marriage.user}>?\n` +
            "Type `yes` to divorce, or `no` to let them stay married!\n\n" +
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
            await instance.database.simpleDelete("MARRIAGE", {
              id: marriage.id,
            });
            await m.reply(
              `<@!${asker.id}> is now single because the evil gods have said so!`
            );
          } else if (m.content.toLowerCase() === "no") {
            collector.stop("final");
            await m.reply(
              `The gods have had mercy and decided not to force divorce <@${asker.id}> away from their lover!`
            );
          }
        });
        collector.on("end", async () => {
          if (collector.endReason !== "final") {
            await msg.reply(
              `My message seems to have been ignored! <@${asker.id}> is not becoming single! *...for now.*`
            );
          }
        });
      },
      instance.config.owner
    ),
  info,
  help: {
    usage: "forcedivorce <@user>",
    examples: ["forcemarry @cass"],
    description: "Forces a user to divorce",
  },
};
