const { withOwner } = require("../../utils/hooks");

const info = {
  name: "reload",
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
};

module.exports = {
  execute: async (instance, message) => {
    return withOwner(
      message.author.id,
      async () => {
        const msg = message.channel.send("> // System Reloading //");
        await instance.initReload();
        await (await msg).edit("> _Reload complete._");
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "reload",
    examples: ["reload"],
    description: "Nuclear option! You know, can end wrong and all!",
  },
};
