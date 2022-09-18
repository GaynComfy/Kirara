const { MessageCollector } = require("discord.js");

const authorized = [
  "189978735816998913",
  "175408504427905025"
]

const info = {
  name: "forcedivorce",
  aliases: ["fdivorce"],
  matchCase: false,
  category: "Administration",
  cooldown: 600,
};
module.exports = {
  execute: async (instance, message) => {
    const id = message.author.id;
    if(!authorized.includes(id)) return;
    const mentionedUser = message.mentions.members.first().id;
    console.log(mentionedUser);
    //const isMarried = instance.cache.exists(`married:${id}`);
    if (message.mentions.users.size === 0) return;
    if (mentionedUser === id){
      await message.channel.send("Use the divorce command yourself, clown.");
      return;
    }
    //if (!mentionedUser.isMarried) {
    //  await message.channel.send(`<@${mentionedUser}> is not married!`);
    //  return;
    //} else {
    await message.channel.send(
      `<@${id}> Are you sure you want to force divorce <@${mentionedUser}>?\nType "yes" to divorce or "no" to stay married!\n\n*You have one minute to reply!*`
    );
    const filter = async m => m.author.id === id;
    const collector = new MessageCollector(message.channel, {
      filter,
      time: 60000,
    });
    collector.on("collect", async m => {
      if (m.content.toLowerCase() === "yes") {
        await message.channel.send(
          `<@${mentionedUser}> is now single because <@${id}> said so!`
        );
        collector.stop("final");
        return;
      } else if (m.content.toLowerCase() === "no") {
        await message.channel.send(
          `<@${id}> decided not to force divorce <@${mentionedUser}> away from their lover!`
        );
        collector.stop("final");
        return;
      }
    });
    collector.on("end", async () => {
      if (collector.endReason !== "final") {
        await message.channel.send(
          `<@${id}> ignored my message! <@${mentionedUser}> is not becoming single! ...*for now*.`
        );
      }
    });
    //}
  },
  info,
  help: {
    usage: "forcedivorce <@user>",
    examples: ["forcemarry @cass"],
    description: "Forces a user to divorce",
  },
};
