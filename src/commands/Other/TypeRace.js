const { MessageEmbed } = require("discord.js");
const info = {
  name: "typerace",
  matchCase: false,
  category: "UwU",
};
module.exports = {
  execute: async (instance, message, args) => {
    const results = [];
    var startTime, endTime;

    function start() {
      startTime = new Date();
    }

    function end() {
      endTime = new Date();
      var timeDiff = endTime - startTime; //in ms
      // strip the ms
      timeDiff /= 1000;

      // get seconds
      var seconds = Math.round(timeDiff);
      return seconds;
    }

    const randomL = Math.random().toString(36).substring(7);
    start();
    message.channel.send(randomL).then((msg) => {
      const filter = (msg) =>
        msg.content.toLowerCase().startsWith(`${randomL}`);

      const collector = message.channel.createMessageCollector(filter, {
        time: 15000,
      });

      collector.on("collect", async (m) => {
        const wpm = randomL.length / 5 / (end() / 60);
        const embed = new MessageEmbed()
          .setDescription(
            `You got the correct Answer! It took ${end()}s \n WPM: ${wpm}`
          )
          .setColor(0xe9a6ff);
        msg.channel.send(embed);
      });
    });
  },
  info,
  help: {
    usage: "typerace",
    examples: ["typerace"],
    description: "typerace",
  },
};
