const { MessageCollector } = require("discord.js");

const info = {
  name: "marry",
  matchCase: false,
  category: "Roleplay",
  cooldown: 600,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) return false;
    const id = message.author.id;
    const mentionedUser = message.mentions.users.first().id;
    //const isMarried = instance.cache.exists(`married:${id}`);
    if (id === mentionedUser) {
      await message.channel.send("Hah, you're lonely... But no.");
      return;
    }
    //if (isMarried) {
    //  await message.channel.send(`<@${id}>, you are still married!`);
    //  return;
    //} else {
    await message.channel.send(
      `<@${mentionedUser}>, <@${id}> proposed to you!\nType "yes" to accept or "no" to decline!\n\n*You have one minute to reply!*`
    );
    const filter = async m => m.author.id === mentionedUser;
    const collector = new MessageCollector(message.channel, {
      filter,
      time: 60000,
    });
    collector.on("collect", async m => {
      if (m.content.toLowerCase() === "yes") {
        await message.channel.send(
          `<@${id}> and <@${mentionedUser}> are now married! Good luck...`
        );
        collector.stop("final");
        return;
      } else if (m.content.toLowerCase() === "no") {
        await message.channel.send(
          `<@${id}> was rejected by <@${mentionedUser}>! Hah, loser.`
        );
        collector.stop("final");
        return;
      }
    });
    collector.on("end", async () => {
      if (collector.endReason !== "final") {
        await message.channel.send(
          `<@${id}> was ignored by <@${mentionedUser}>! That makes a lot of sense...`
        );
      }
    });
    //}
  },
  info,
  help: {
    usage: "marry <@user>",
    examples: ["marry @cass"],
    description: "Requests to marry a user",
  },
};
