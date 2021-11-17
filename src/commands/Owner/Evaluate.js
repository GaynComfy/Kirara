const { MessageEmbed } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const util = require("util");
const Color = require("../../utils/Colors.json");

const clean = text => {
  if (typeof text === "string") {
    return text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203));
  } else {
    return text;
  }
};

const info = {
  name: "evaluate",
  aliases: ["eval"],
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
  cooldown: 60,
  disabled: process.env.NODE_ENV !== "development",
};
module.exports = {
  execute: async (instance, message, args) => {
    return withOwner(
      message.author.id,
      async () => {
        try {
          const code = args.join(" ");
          // eslint-disable-next-line no-eval
          let evaled = eval(code);

          if (typeof evaled !== "string") {
            evaled = util.inspect(evaled);
          }
          if (evaled.length > 2000) {
            const embed = new MessageEmbed()
              .setDescription(
                "<:Sirona_NoCross:762606114444935168> The eval result is over 2000 characters."
              )
              .setColor(Color.red);
            return message.channel.send({ embeds: [embed] });
          }
          return message.channel.send(clean(evaled), { code: "xl" });
        } catch (err) {
          return message.channel.send(
            `\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``
          );
        }
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "eval <code>",
    examples: ["eval message.author.id"],
    description: "Evaluate JavaScript code! (Definitely not unsafe!)",
  },
};
