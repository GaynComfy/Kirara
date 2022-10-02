const { withOwner } = require("../../utils/hooks");
const { MessageCollector } = require("discord.js");

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
        const mentionedUser = message.mentions.members.first().id;
        console.log(mentionedUser);
        //const isMarried = instance.cache.exists(`married:${id}`);
        if (mentionedUser === message.author.id) {
          await message.channel.send(
            "Use the divorce command yourself, clown."
          );
          return;
        }
        //if (!mentionedUser.isMarried) {
        //  await message.channel.send(`<@${mentionedUser}> is not married!`);
        //  return;
        //} else {
        await message.channel.send(
          `Are you sure you want to force divorce <@${mentionedUser}>?\nType "yes" to divorce or "no" to stay married!\n\n*You have one minute to reply!*`
        );
        const filter = async m => m.author.id === message.author.id;
        const collector = new MessageCollector(message.channel, {
          filter,
          time: 60000,
        });
        collector.on("collect", async m => {
          if (m.content.toLowerCase() === "yes") {
            await message.channel.send(
              `<@${mentionedUser}> is now single because the evil gods have said so!`
            );
            collector.stop("final");
            return;
          } else if (m.content.toLowerCase() === "no") {
            await message.channel.send(
              `The gods have had mercy and decided not to force divorce <@${mentionedUser}> away from their lover!`
            );
            collector.stop("final");
            return;
          }
        });
        collector.on("end", async () => {
          if (collector.endReason !== "final") {
            await message.channel.send(
              `My message seems to have been ignored! <@${mentionedUser}> is not becoming single! *...for now.*`
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
