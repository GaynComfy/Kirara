const { MessageEmbed } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const Color = require("../../utils/Colors.json");
const info = {
  name: "evaluate",
  aliases: ["eval"],
  matchCase: false,
  category: "Owner",
  cooldown: 60,
  disabled: true,
};
const clean = (text) => {
  if (typeof text === "string") {
    return text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203));
  } else {
    return text;
  }
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
            evaled = require("util").inspect(evaled);
          }
          if (evaled.length > 2000) {
            const embed = new MessageEmbed()
              .setDescription(
                "<:Sirona_NoCross:762606114444935168> The eval result is over 2000 characters."
              )
              .setColor(Color.red);
            return message.channel.send(embed);
          }
          message.channel.send(clean(evaled), { code: "xl" });
        } catch (err) {
          message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "evaluate eval",
    examples: ["eval message.author.id"],
    description: "Evaluate javascript code!",
  },
};
