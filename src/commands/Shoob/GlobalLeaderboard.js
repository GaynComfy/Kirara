const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const Fetcher = require("../../utils/CardFetcher");
const { EmbedBuilder } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");

const optout = require("../../utils/cacheUtils").getOptOutStmt(
  "CARD_CLAIMS.discord_id"
);

const info = {
  name: "globalleaderboard",
  aliases: ["glb"],
  matchCase: false,
  category: "Shoob",
  cooldown: 15,
  perms: ["AddReactions", "ManageMessages", "ReadMessageHistory"],
};

module.exports = {
  execute: async (instance, message) => {
    message.channel.sendTyping().catch(() => null);
    let last = -1;

    return createPagedResults(message, Infinity, async page => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const k = `glb:${offset}`;
      let claimers = [];

      const exists = await instance.cache.exists(k);
      if (exists) {
        const e = await instance.cache.get(k);
        claimers = JSON.parse(e);
      } else {
        const { rows: claims } = await instance.database.pool.query(
          "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
            "AND season=$1 AND " +
            optout +
            " GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $2",
          [instance.config.season, offset]
        );
        instance.cache.setExpire(k, JSON.stringify(claims), 60 * 5);
        claimers = claims;
      }
      if (claimers.length === 0 && page === 0) {
        const embed = new EmbedBuilder()
          .setDescription(
            `<:Sirona_NoCross:762606114444935168> The bot hasn't tracked any claims this season.`
          )
          .setColor(Color.red);
        await message.channel.send({ embeds: [embed] });
        return null;
      }
      if (claimers.length === 0 && last === -1) {
        last = page - 1;
        if (last === -1) last = 0;
      } else if (claimers.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const users = [];
      const claims = [];

      let increase = 1;
      for (const entry of claimers) {
        const [user, profile] = await Promise.all([
          instance.client.users.fetch(entry.discord_id),
          Fetcher.fetchProfile(instance, entry.discord_id),
        ]);
        if (profile.banned) continue;
        const tag = user
          ? `${user.username}#${user.discriminator}`
          : "Unknown user";
        users.push(`\`${increase++}.\` \`${tag}\``);
        claims.push(`> \`${entry.c} ${entry.c === 1 ? "claim" : "claims"}\``);
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Global Leaderboard",
          iconURL: Constants.avatar,
        })
        .setColor(claimers.length > 0 ? "#f49e17" : Color.red)
        .setImage(Constants.footer)
        .setFooter({
          text:
            (!singlePage
              ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
              : "឵") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : ""),
        })
        .addFields([
          { name: `•   __User__`, value: users.join("\n"), inline: true },
          { name: `•   __Claims__`, value: claims.join("\n"), inline: true },
        ]);

      if (last === 0) {
        await message.channel.send({ embeds: [embed] });
        return false;
      }
      return embed;
    });
  },
  info,
  help: {
    usage: "glb [total]",
    examples: ["glb", "glb [total]"],
    description: "Top global claims!",
  },
};
