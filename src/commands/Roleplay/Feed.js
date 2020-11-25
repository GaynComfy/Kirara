const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "feed",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("feed");
    await message.channel.send(
      generateRolePlayEmbed(
        "feeds",
        message.author.id,
        message.mentions.users.first().id
      ).setThumbnail(url)
    );
    return true;
  },
  info,
  help: {
    usage: "Feed @user",
    examples: ["Feed @Nota"],
    description: "Feeds a user",
  },
};
