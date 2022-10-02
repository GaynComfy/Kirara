const { MessageCollector } = require("discord.js");
const { getMarriage } = require("./utils");

const info = {
  name: "divorce",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size !== 0) return false;
    const asker = message.author;

    const marry = await getMarriage(instance, asker.id, true);
    if (marry.length === 0) {
      await message.reply(
        "You are not married! What a lonely person; you can't divorce loneliness!"
      );
      return false;
    }
    const marriage = marry[0];

    const msg = await message.reply(
      `Are you sure you want to give up on your marriage with <@!${marriage.user}>, <@!${asker.id}>?\n` +
        "Type `yes` to divorce, or `no` to stay married!\n\n" +
        "> *You have one minute to reply!*"
    );
    const filter = async m => m.author.id === asker.id;
    const collector = new MessageCollector(message.channel, {
      filter,
      time: 60000,
    });
    collector.on("collect", async m => {
      if (m.content.toLowerCase() === "yes") {
        await instance.database.simpleDelete("MARRIAGE", {
          id: marriage.id,
        });
        await m.reply(`Yay! You are now ~~lonely~~ single!`);
        return collector.stop("final");
      } else if (m.content.toLowerCase() === "no") {
        await m.reply(`Nice! You shall still be ~~trapped~~ married!`);
        return collector.stop("final");
      }
    });
    collector.on("end", async () => {
      if (collector.endReason !== "final") {
        await msg.reply(
          `Time is up, <@${asker.id}>! You shall not be single for a while more!`
        );
      }
    });
  },
  info,
  help: {
    usage: "divorce",
    examples: ["divorce"],
    description: "Request to divorce and leave an unhappy marriage!",
  },
};
