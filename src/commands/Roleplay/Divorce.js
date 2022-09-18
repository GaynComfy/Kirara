const { MessageCollector } = require("discord.js");

const info = {
  name: "divorce",
  matchCase: false,
  category: "Roleplay",
  cooldown: 600,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 1) return false;
    const id = message.author.id;
    //if (!isMarried) {
    //  await message.channel.send(`<@${id}>, you are not married! What a lonely person!`);
    //  return;
    //} else {
    await message.channel.send(
      `Are you sure you want to give up on your relationship, <@${id}>?\nType "yes" to divorce or "no" to stay married!\n\n*You have one minute to reply!*`
    );
    const filter = async m => m.author.id === id;
    const collector = new MessageCollector(message.channel, {
      filter,
      time: 60000,
    });
    collector.on("collect", async m => {
      if (m.content.toLowerCase() === "yes") {
        await message.channel.send(
          `Yay, <@${id}>! You are now ~~lonely~~ single!`
        );
        collector.stop("final");
        return;
      } else if (m.content.toLowerCase() === "no") {
        await message.channel.send(
          `Nice, <@${id}>! You are still ~~trapped~~ married!`
        );
        collector.stop("final");
        return;
      }
    });
    collector.on("end", async () => {
      if (collector.endReason !== "final") {
        await message.channel.send(
          `Time is up, <@${id}>! You still aren't single!`
        );
      }
    });
    //}
  },
  info,
  help: {
    usage: "divorce",
    examples: ["divorce"],
    description: "Requests to divorce",
  },
};
