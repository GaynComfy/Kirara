const info = {
  name: "choke",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  disabled: process.env.NODE_ENV !== "development",
  usage: "choke",
  examples: ["choke"],
  description: "just choke",
};
module.exports = {
  execute: async (instance, message) => {
    message.channel.send(
      "https://cdn.discordapp.com/attachments/690981388299665478/833083826422808576/image0.png"
    );
  },
  info,
};
