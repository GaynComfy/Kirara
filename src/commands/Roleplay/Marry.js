const { MessageCollector } = require("discord.js");
const { getMarriage } = require("./utils");

const info = {
  name: "marry",
  matchCase: false,
  category: "Roleplay",
  cooldown: 600,
};
const sentientBots = ["736067018628792322", "85614143951892480"];

module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) return false;
    const asker = message.author;
    const asking = message.mentions.users.first();

    if (asker.id === asking.id) {
      await message.reply(
        "Hah, you're lonely... But no, I can't let you do that."
      );
      return false;
    }
    if (asking.bot && !sentientBots.includes(asking.id)) {
      await message.reply(
        "I know you're desperate, but I don't think a bot's gonna marry you. :("
      );
      return false;
    }

    const marry = await getMarriage(instance, asker.id);
    if (marry.find(m => m.user === asking.id)) {
      await message.reply(
        "You are already married to them! I don't think you need to renew your marriage..."
      );
      return false;
    }
    // lol
    if (marry.length !== 0 && asker.id !== "175408504427905025") {
      await message.reply(
        "You are already married to someone else! Bad bad. I'm not into poly yet."
      );
      return false;
    }

    const msg = await message.reply(
      `<@!${asking.id}>, <@!${asker.id}> has proposed to you!\n` +
        "Type `yes` to accept, or `no` to decline!\n\n" +
        "> *You have one minute to reply!*"
    );
    const filter = async m => m.author.id === asking.id;
    const collector = new MessageCollector(message.channel, {
      filter,
      time: 60000,
    });
    collector.on("collect", async m => {
      if (m.content.toLowerCase() === "yes") {
        await instance.database.simpleInsert("MARRIAGE", {
          asker: asker.id,
          married: asking.id,
          date_added: new Date(),
        });
        await m.reply(
          `**<@!${asker.id}> and <@!${asking.id}> are now married!** *(good luck...)*`
        );
        return collector.stop("final");
      } else if (m.content.toLowerCase() === "no") {
        await m.reply(
          `*<@!${asker.id}> was rejected by <@!${asking.id}>!* Hah, loser.`
        );
        return collector.stop("final");
      }
    });
    collector.on("end", async () => {
      if (collector.endReason !== "final") {
        await msg.reply(
          `<@${asker.id}> was ignored by <@${asking.id}>! *That makes a lot of sense...*`
        );
      }
    });
  },
  info,
  help: {
    usage: "marry <@user>",
    examples: ["marry @cass"],
    description: "Requests to marry a user",
  },
};
