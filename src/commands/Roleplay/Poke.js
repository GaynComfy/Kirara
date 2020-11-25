const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "poke",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("poke");
    await message.channel.send(
      generateRolePlayEmbed(
        "pokes",
        message.author.username,
        message.mentions.users.first().username
      ).setImage(url)
    );
    return true;
  },
  info,
  help: {
    usage: "poke @user",
    examples: ["poke @Nota"],
    description: "Pokes a user",
  },
};
