const { MessageEmbed } = require("discord.js");

const info = {
  name: "help",
  matchCase: false,
  category: "Information",
};
const emotes = {
  Information: "<a:Sirona_star:748985391360507924>",
  Administration: "<a:Hypesquad:741202057507373136>",
  Shoob: "<:T6:754541597479403612>",
  Owner: "<a:Sirona_Tick:749202570341384202>",
  UwU: "<a:ANIuwu:727780154264256565>",
  Giveaway: "🎁",
  Roleplay: "<a:Sirona_boost:755897634216083516>",
};
module.exports = {
  execute: async (instance, message, args) => {
    const all = Object.values(instance.eventManager.commands);
    if (args.length === 0) {
      const categories = [];
      all.forEach((elem) => {
        if (!categories.includes(elem.info.category))
          categories.push(elem.info.category);
      });
      const embed = new MessageEmbed();
      categories.forEach((category) => {
        const dirSize = all.filter((cmd) => cmd.info.category === category);
        let mappedOut = dirSize.map((x) => `\`${x.info.name}\``).join(", ");
        if (category === "Owner") {
          return;
        }
        if (
          category === "Moderation" &&
          !message.member.permissions.has("MANAGE_MESSAGES")
        )
          mappedOut = "`No commands available..`";

        embed
          .addField(
            `${dirSize.length} | ${emotes[category]} **${category} Commands**`,
            mappedOut
          )
          .setDescription(
            "Use ``s!help [command]`` to get more help! \nExample: ``s!help stats`` \n\u200b"
          )
          .setColor("#e0e0e0")
          .setAuthor(
            `Help Menu${message.guild ? ` | ${message.guild.name}` : ""}`,
            message.guild
              ? message.guild.iconURL()
              : message.author.displayAvatarURL({ type: "png" })
          )
          .setFooter(
            "by G&C Dev Team | s!help [cmd] | discord.gg/comfy",
            "https://cdn.discordapp.com/avatars/748100524246564894/03cfa9d81490e748b10e26d37a197525.png?size=2048"
          );
      });

      return message.channel.send(embed);
    }
    const cmd = all.find((e) => e.info.name === args[0]);
    const embed = new MessageEmbed()
      .setColor("#e0e0e0")
      .setAuthor(
        `Help: ${cmd.info.name}${
          message.guild ? ` | ${message.guild.name}` : ""
        }`,
        message.guild
          ? message.guild.iconURL()
          : message.author.displayAvatarURL({ type: "png" })
      )
      .setDescription(
        `
                    **Command Name**: \`${cmd.info.name}\`
                    **Command Aliases**: ${`${
                      (cmd.info.aliases || [])
                        .map((x) => `\`${x}\``)
                        .join(", ") || "No Alias"
                    }`}
                    **Command Cooldown**: \`${
                      cmd.info.cooldown / 1000 + "s" || 0
                    }\`
                    **Owner Only**: \`${cmd.ownerOnly ? "Yes" : "No" || "No"}\`
                    **Command Description**: ${
                      cmd.help.description || "A command"
                    }
                    **Command Usage**: \`${cmd.help.usage || ""}\`
                    **Command Examples**:\n\`\`\`${
                      cmd.help.examples.join("\n") || cmd.aliases[0]
                    }\`\`\``
      )
      .setFooter("Syntax: [required] : <optional>");
    return message.channel.send(embed);
  },
  info,
  help: {
    usage: "help",
    examples: ["help", "comands", "h"],
    description: "Display's the commands of the bot",
  },
};
