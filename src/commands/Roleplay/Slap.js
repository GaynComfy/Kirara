const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "slap",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("slap");
    await message.channel.send(
      generateRolePlayEmbed(
        "slaps",
        message.author.id,
        message.mentions.users.first().id
      ).setThumbnail(url)
    );
    return true;
  },
  info,
  help: {
    usage: "slap @user",
    examples: ["slap @~Nota~"],
    description: "Slaps a user",
  },
};
