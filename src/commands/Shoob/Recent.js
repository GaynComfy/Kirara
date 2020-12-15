const { tierInfo } = require("../../utils/cardUtils");
const humanizeDuration = require("humanize-duration");
const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");

const info = {
  name: "recent",
  aliases: ["r"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];

module.exports = {
  execute: async (instance, message, args) => {
    const isGlobal =
      args.length >= 1 &&
      (args[0].toLowerCase() === "global" || args[0].toLowerCase() === "g");
    if (isGlobal) args.shift();
    const hasTier = args.length >= 1 && allowed.includes(args[0].toLowerCase());
    if (args.length > 0 && !hasTier) return false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : null;
    const member = message.meber || {};
    const { rows: recentCards } = isGlobal
      ? hasTier
        ? await instance.database.pool.query(
            `SELECT * FROM CARD_CLAIMS WHERE tier=$1 ORDER BY id DESC LIMIT 5`,
            [tier]
          )
        : await instance.database.pool.query(
            `SELECT * FROM CARD_CLAIMS ORDER BY id DESC LIMIT 5`
          )
      : hasTier
      ? await instance.database.pool.query(
          `SELECT * FROM CARD_CLAIMS WHERE server_id=$1 AND tier=$2 ORDER BY id DESC LIMIT 5`,
          [instance.serverIds[message.guild.id], tier]
        )
      : await instance.database.pool.query(
          `SELECT * FROM CARD_CLAIMS WHERE server_id=$1 ORDER BY id DESC LIMIT 5`,
          [instance.serverIds[message.guild.id]]
        );

    const selectedTitle =
      args.length !== 0
        ? `${tierInfo[args[0].toUpperCase()].emoji} __Recent cards: ` +
          `Tier ${tierInfo[args[0].toUpperCase()].num}__`
        : "<:Flame:783439293506519101> __Recent cards__";
    const selectedColor =
      args.length !== 0 ? tierInfo[args[0].toUpperCase()].color : Color.default;

    const embed = new MessageEmbed()
      .setTitle(selectedTitle)
      .setColor(selectedColor)
      .setDescription(
        `Showing ${
          isGlobal ? "global claims" : `claims in \`${message.guild.name}\``
        }`
      );
    if (recentCards.length !== 0) {
      recentCards.reverse();

      const claimers = [];
      for (const item of recentCards) {
        if (!item.claimed) {
          claimers.push("> `No one`");
          continue;
        }

        if (isGlobal) {
          const user = await instance.client.users.fetch(item.discord_id);
          if (user)
            claimers.push(`> \`${user.username}#${user.discriminator}\``);
          else claimers.push("> `Unknown user`");
        } else {
          claimers.push(`> <@!${item.discord_id}>`);
        }
      }

      const cards = recentCards.map(
        (item) =>
          `> \`T${item.tier}\` • [\`${item.card_name.substr(0, 15)}` +
          `${parseInt(item.issue) > 0 ? ` V${item.issue}` : ""}\`]` +
          `(https://animesoul.com/cards/info/${item.card_id})`
      );
      embed.addField("•   `T ` • __**Cards:**__", cards, true);
      embed.addField("•   __**Claimed by:**__", claimers, true);
      const since = humanizeDuration(
        Date.now() - recentCards[recentCards.length - 1].time,
        { round: true, units: ["d", "h", "m", "s"] }
      );
      embed.setFooter(`Last card spawned: ${since} ago`);
    } else {
      embed.setDescription("No cards have spawned yet.");
    }
    message.channel.send(embed);
    return true;
  },
  info,
  help: {
    usage: "recent [global] [T1/T2/T3/T4/T5/T6]",
    examples: ["recent t1"],
    description: "Show last cards spawned by Shoob",
  },
};
