const { withOwner } = require("../../utils/hooks");

const info = {
  name: "reload",
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
  usage: "reload",
  examples: ["reload"],
  description: "Nuclear option! You know, can end wrong and all!",
};

module.exports = {
  execute: async (instance, message) => {
    return withOwner(
      message.author.id,
      async () => {
        message.channel.send("// System Reloading //");
        instance.initReload();
      },
      instance.config.owner
    );
  },
  info,
};
