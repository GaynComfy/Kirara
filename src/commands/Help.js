module.exports = {
  execute: async (instance, message, args) => {
    message.reply("this worked!");
  },
  init: async (instance) => {},
  info: {
    name: "help",
    aliases: ["h"],
    matchCase: false,
    category: "Util",
  },
  help: {
    info: "idk need to figure this out",
  },
};
