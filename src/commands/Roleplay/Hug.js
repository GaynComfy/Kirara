const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "hug",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("hug");
    await message.channel.send(
      generateRolePlayEmbed(
        "hugged",
        message.author.id,
        message.mentions.users.first().id
      ).setThumbnail(url)
    );
    return true;
  },
  info,
  help: {
    usage: "hug @user",
    examples: ["hug @Nota"],
    description: "Hugs a user",
  },
};
