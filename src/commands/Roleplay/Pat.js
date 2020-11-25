const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "pat",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("pat");
    await message.channel.send(
      generateRolePlayEmbed(
        "pats",
        message.author.id,
        message.mentions.users.first().id
      ).setThumbnail(url)
    );
    return true;
  },
  info,
  help: {
    usage: "pat @user",
    examples: ["pat @~Nota~"],
    description: "Pats a user",
  },
};
