const { tierInfo } = require("../../utils/cardUtils");
const moment = require("moment");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "recent",
  aliases: ["r"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];

module.exports = {
  execute: async (instance, message, args) => {
    if (args.length > 0 && !allowed.includes(args[0])) return false;
    const member = message.meber || {};
    const { rows: recentCards } =
      args.length === 0
        ? await instance.database.pool.query(
            "SELECT * FROM CARD_CLAIMS WHERE server_id=$1 ORDER BY id DESC LIMIT 5",
            [instance.serverIds[message.guild.id]]
          )
        : await instance.database.pool.query(
            "SELECT * FROM CARD_CLAIMS WHERE server_id=$1 AND tier=$2 ORDER BY id DESC LIMIT 5",
            [instance.serverIds[message.guild.id], args[0][1].toUpperCase()]
          );

    const selectedTitle =
      args.length !== 0
        ? `${
            tierInfo[args[0].toUpperCase()].emoji
          } __Recent cards: ${args[0].toUpperCase()}__`
        : "__Recent cards__";
    const selectedColor =
      args.length !== 0 ? tierInfo[args[0].toUpperCase()].color : "#eca8ff";

    const embed = new MessageEmbed()
      .setTitle(selectedTitle)
      .setColor(selectedColor)
      .setDescription(`Showing \`\`${message.guild.name}\`\``);
    if (recentCards.length !== 0) {
      recentCards.reverse();

      const claimers = recentCards.map((item) => {
        if (!item.claimed) return "> ``No one``";
        //const user = instance.client.users.resolve(item.discord_id) || {};
        return `> <@${item.discord_id}>`;
      });

      const cards = recentCards.map(
        (item) =>
          `> \`\`T${item.tier}\`\` • \`\`${item.card_name.substr(0, 15)}` +
          `${parseInt(item.issue) > 0 ? ` V${item.issue}` : ''}\`\``
      );
      embed.addField("•   ``T `` • __**Cards:**__", cards, true);
      embed.addField("•   __**Claimed by:**__", claimers, true);
      const dates = recentCards[recentCards.length - 1].time;
      embed.setFooter(`Last card spawned: ${moment(dates).fromNow()}.`);
    } else {
      embed.addField("Cards:", "``No cards have spawned yet.``", true);
    }
    message.channel.send(embed);
    return true;
  },
  info,
  help: {
    usage: "recent [T1|T2|T3|T4|T5|T6]",
    examples: ["recent t1"],
    description: "Show last cards spawned by Shoob",
  },
};
