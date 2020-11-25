const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "kiss",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("kiss");
    await message.channel.send(
      generateRolePlayEmbed(
        "kisses",
        message.author.username,
        message.mentions.users.first().username
      ).setImage(url)
    );
    return true;
  },
  info,
  help: {
    usage: "kiss @user",
    examples: ["kiss @~Nota~"],
    description: "Kisses a user",
  },
};
