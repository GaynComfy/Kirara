const { tierInfo } = require("../../utils/cardUtils");
const humanizeDuration = require("humanize-duration");
const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");

const optout = require("../../utils/cacheUtils").getOptOutStmt(
  "CARD_CLAIMS.discord_id"
);

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
    const reverse =
      args.length >= 1 &&
      (args[0].toLowerCase() === "reverse" || args[0].toLowerCase() === "r");
    if (reverse) args.shift();
    const isGlobal =
      args.length >= 1 &&
      (args[0].toLowerCase() === "global" || args[0].toLowerCase() === "g");
    if (isGlobal) args.shift();
    const hasTier = args.length >= 1 && allowed.includes(args[0].toLowerCase());
    if (args.length > 0 && !hasTier) return false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : null;
    const tierSettings = hasTier ? tierInfo[`T${tier}`] : {};

    const k = `recent:${instance.serverIds[message.guild.id]}:${
      hasTier ? tier : "all"
    }`;
    const exists = !isGlobal && (await instance.cache.exists(k));

    let recentCards;
    if (exists) {
      const e = await instance.cache.get(k);
      recentCards = JSON.parse(e);
      // workaround for broken last spawn time
      recentCards[0].time = new Date(recentCards[0].time);
    } else {
      const { rows: cards } = isGlobal // only if global
        ? hasTier
          ? await instance.database.pool.query(
              `SELECT * FROM CARD_CLAIMS WHERE season=$1 AND tier=$2 AND ${optout} ORDER BY id DESC LIMIT 5`,
              [instance.config.season, tier]
            )
          : await instance.database.pool.query(
              `SELECT * FROM CARD_CLAIMS WHERE season=$1 AND ${optout} ORDER BY id DESC LIMIT 5`,
              [instance.config.season]
            )
        : hasTier
        ? await instance.database.pool.query(
            `SELECT * FROM CARD_CLAIMS WHERE server_id=$1 AND season=$2 AND tier=$3 ORDER BY id DESC LIMIT 5`,
            [instance.serverIds[message.guild.id], instance.config.season, tier]
          )
        : await instance.database.pool.query(
            `SELECT * FROM CARD_CLAIMS WHERE server_id=$1 AND season=$2 ORDER BY id DESC LIMIT 5`,
            [instance.serverIds[message.guild.id], instance.config.season]
          );

      const expireTime = hasTier ? 60 * 20 : 60 * 10;
      instance.cache.setExpire(k, JSON.stringify(cards), expireTime);
      recentCards = cards;
    }

    const selectedTitle = hasTier
      ? `${tierSettings.emoji} __Recent cards: Tier ${tierSettings.num}__`
      : "<:Flame:783439293506519101> __Recent cards__";
    const selectedColor = hasTier ? tierSettings.color : Color.default;

    const embed = new MessageEmbed()
      .setTitle(selectedTitle)
      .setColor(selectedColor)
      .setDescription(
        `Showing ${
          isGlobal ? "global claims" : `claims in \`${message.guild.name}\``
        }`
      );
    if (recentCards.length !== 0) {
      if (!reverse) recentCards.reverse();

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

      const cards = recentCards.map(item => {
        let ti = `\`T${item.tier}\` •`;
        if (item.message_id && item.channel_id) {
          ti = `[${ti}](https://discord.com/channels/${message.guild.id}/${item.channel_id}/${item.message_id})`;
        }

        return (
          `> ${ti} [\`${item.card_name.substr(0, 15)}` +
          `${parseInt(item.issue) > 0 ? ` V${item.issue}` : ""}\`]` +
          `(https://animesoul.com/cards/info/${item.card_id})`
        );
      });
      embed.addField("•   `T ` • __**Cards**__", cards, true);
      embed.addField("•   __**Claimed by**__", claimers, true);
      const since = humanizeDuration(
        Date.now() - recentCards[reverse ? 0 : recentCards.length - 1].time,
        { round: true, units: ["d", "h", "m", "s"] }
      );
      embed.setFooter(`Last card spawned: ${since} ago`);
    } else {
      embed.setDescription(
        "> <:Sirona_NoCross:762606114444935168> No cards have spawned yet this season."
      );
    }
    return message.channel.send(embed);
  },
  info,
  help: {
    usage: "recent [reverse] [global] [T1/T2/T3/T4/T5/T6]",
    examples: ["recent t1", "recent g t6", "r r"],
    description:
      "Show last cards spawned by Shoob\n" +
      "Note that this command will show info about users. See command: lb-optout",
  },
};
