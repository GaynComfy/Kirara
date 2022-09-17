const { MessageCollector } = require("discord.js");

const authorized = [
  "189978735816998913",
  "175408504427905025"
]

const info = {
  name: "forcemarry",
  aliases: ["fmarry"],
  matchCase: false,
  category: "Administration",
  cooldown: 600,
};
module.exports = {
  execute: async (instance, message) => {
    const id = message.author.id;
    if(!authorized.includes(id)) return;
    const mentionedUserOne = message.mentions.members.first().id;
    console.log(mentionedUserOne);
    const mentionedUserTwo = message.mentions.members.last().id
    console.log(mentionedUserTwo);
    //const isMarried = instance.cache.exists(`married:${id}`);
    if (message.mentions.users.size === 0) return;
    if (mentionedUserTwo === id) return;
    if (mentionedUserTwo === undefined) return;
    //if (mentionedUserOne.isMarried) {
    //  await message.channel.send(`<@${mentionedUserOne}> is already married!`);
    //  return;
    //}
    //else if (mentionedUserTwo.isMarried) {
    //  await message.channel.send(`<@${mentionedUserTwo}> is already married!`);
    //  return;
    //} else {
    await message.channel.send(
      `<@${id}> Are you sure you want to force marry <@${mentionedUserOne}> and <@${mentionedUserTwo}>?\nType "yes" to accept or "no" to decline!\n\n*You have one minute to reply!*`
    );
    const filter = async m => m.author.id === id;
    const collector = new MessageCollector(message.channel, {
      filter,
      time: 60000,
    });
    collector.on("collect", async m => {
      if (m.content.toLowerCase() === "yes") {
        await message.channel.send(
          `<@${mentionedUserOne}> and <@${mentionedUserTwo}> are now married because <@${id}> said so!`
        );
        collector.stop("final");
        return;
      } else if (m.content.toLowerCase() === "no") {
        await message.channel.send(
          `<@${id}> decided not to force marriage upon <@${mentionedUserOne}> and <@${mentionedUserTwo}>!`
        );
        collector.stop("final");
        return;
      }
    });
    collector.on("end", async () => {
      if (collector.endReason !== "final") {
        await message.channel.send(
          `<@${id}> ignored my message! <@${mentionedUserOne}> and <@${mentionedUserTwo}> are not being forced to marry!`
        );
      }
    });
    //}
  },
  info,
  help: {
    usage: "forcemarry <@user> <@user>",
    examples: ["forcemarry @cass @cass"],
    description: "Forces a user to marry another user",
  },
};
