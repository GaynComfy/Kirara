const { MessageEmbed } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "help",
  matchCase: false,
  category: "Information",
  usage: "help",
  examples: ["help", "commands", "h bot"],
  description: "Displays the commands of the bot",
};

const emotes = {
  Information: "<:KiraraHmm:775767857811816478>",
  Administration: "<:KiraraSmart:775767857798578207>",
  Shoob: "<:shoob:760021745905696808>",
  UwU: "<:KiraraBlush:775767857324752908>",
  Roleplay: "<:AiriKiraraHug:775767850946265104>",
};

module.exports = {
  execute: async (instance, message, args) => {
    const prefix =
      instance.guilds[message.guild.id].prefix || instance.config.prefix;
    const all = Object.values(instance.eventManager.commands);
    const embed = new MessageEmbed().setColor("#e0e0e0");

    if (args.length === 0) {
      const categories = [];
      all.forEach(elem => {
        if (!categories.includes(elem.info.category))
          categories.push(elem.info.category);
      });

      embed
        .setAuthor(
          `Help Menu${message.guild ? ` | ${message.guild.name}` : ""}`,
          message.guild
            ? message.guild.iconURL({ dynamic: true })
            : message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `Use \`${prefix}help [command]\` to get more help! \nExample: \`${prefix}help stats\` \nNote that certain commands might display usernames in lists retrieved by the bot, see comand details.\n\u200b`
        )
        .setFooter(
          `by G&C Dev Team | ${prefix}help [cmd] | discord.gg/comfy`,
          Constants.avatar
        );
      categories.forEach(category => {
        const dirSize = all.filter(cmd => {
          if (cmd.info.guilds && !cmd.info.guilds.includes(message.guild.id))
            return false;
          return cmd.info.category === category;
        });
        let mappedOut = dirSize.map(x => `\`${x.info.name}\``).join(", ");
        if (
          category === "Owner" ||
          category === "Moderation" ||
          dirSize.length === 0
        ) {
          return;
        }

        embed.addField(
          `${dirSize.length} | ${emotes[category]} **${category} Commands**`,
          mappedOut
        );
      });

      return message.channel.send({ embeds: [embed] });
    }

    const cmd = all.find(
      e => e.info.name === args[0] || (e.info.aliases || []).includes(args[0])
    );
    if (cmd) {
      embed
        .setAuthor(
          `Help: ${cmd.info.name}${
            message.guild ? ` | ${message.guild.name}` : ""
          }`,
          message.guild
            ? message.guild.iconURL({ dynamic: true })
            : message.author.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `**Name**: \`${cmd.info.name}\`
  **Aliases**: ${
    (cmd.info.aliases || []).map(x => `\`${x}\``).join(", ") || "No Alias"
  }
  **Cooldown**: \`${
    cmd.info.cooldown > 0 ? `${cmd.info.cooldown || 0}s` : "None"
  }\`
  **Owner Only**: \`${
    cmd.info.ownerOnly || cmd.ownerOnly ? "Yes" : "No" || "No"
  }\`
  **Description**: ${cmd.info.description || "A command"}
  **Usage**: \`${cmd.info.usage || ""}\`
  **Examples**:\n\`\`\`diff\n+ ${
    cmd.info.examples.join("\n+ ") || cmd.aliases[0]
  }\`\`\``
        )
        .setFooter("Syntax: <required> | [optional]", Constants.avatar);
    } else {
      embed
        .setColor("#ff1100")
        .setDescription(
          "<:Sirona_NoCross:762606114444935168> That command doesn't exists."
        );
    }
    return message.channel.send({ embeds: [embed] });
  },
  info,
};
