const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "cuddle",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("cuddle");
    await message.channel.send(
      generateRolePlayEmbed(
        "cuddle's",
        message.author.id,
        message.mentions.users.first().id
      ).setThumbnail(url)
    );
    return true;
  },
  info,
  help: {
    usage: "cuddle @user",
    examples: ["cuddle @~Nota~"],
    description: "Cuddles a user",
  },
};
