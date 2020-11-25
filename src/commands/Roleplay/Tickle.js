const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "tickle",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("tickle");
    await message.channel.send(
      generateRolePlayEmbed(
        "tickles",
        message.author.username,
        message.mentions.users.first().username
      ).setImage(url)
    );
    return true;
  },
  info,
  help: {
    usage: "Tickle @user",
    examples: ["Tickle @Nota"],
    description: "Tickles a user",
  },
};
