// yes I definitely didn't move all of this to a file just to re-use
// the same code in both Card and Search, considering no need was needed.
const moment = require("moment");
const Fetcher = require("../../utils/CardFetcher");
const DbFetcher = require("../../utils/DbFetcher");
const Constants = require("../../utils/Constants.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

exports.getCard = async (instance, message, card, tracked, botMessage) => {
  if (card === null) return false;
  const tierSettings = tierInfo[`T${card.tier}`];
  const claims = tracked
    ? await DbFetcher.fetchCardCount(instance, card.id)
    : await Fetcher.fetchCardCount(instance, card.id);
  const batch = (card.series || []).find((c) => c.startsWith("Batch "));
  const makers = (card.creators || [])
    .filter((c) => c.type === "maker")
    .map((maker) => `[__**${maker.name}**__](${maker.link})`);
  const artists = (card.creators || [])
    .filter((c) => c.type === "artist")
    .map((artist) => `[__**${artist.name}**__](${artist.link})`);
  const cardImage = encodeURI(card.image_url).replace(".webp", ".gif");
  const event = card.event ? card.series[card.series.length - 1] : null;
  const description =
    `\`Tier: ${card.tier}\`\n` +
    `\`Highest Issue: ${card.claim_count}\`\n` +
    `\`Source: ${card.series[0] || "-"}\`` +
    (event ? `\n\`Event: ${event}\`` : "")(batch ? `\n\`${batch}\`` : "") +
    (makers.length !== 0
      ? `\nCard ${makers.length === 1 ? "Maker" : "Makers"}: ${makers.join(
          ", "
        )}`
      : "") +
    (artists.length !== 0
      ? `\n${artists.length === 1 ? "Artist" : "Artists"}: ${artists.join(
          ", "
        )}`
      : "");

  const pages = Math.ceil(claims / 10);
  return await createPagedResults(
    message,
    2 + (pages > 0 ? pages : 1),
    async (page) => {
      const embed = MessageEmbed()
        .setTitle(
          `${tierSettings.emoji}  •  ${card.name}  •  ${
            card.tier === "S"
              ? "S"
              : Array(Number.parseInt(card.tier))
                  .fill()
                  .map(() => "★")
                  .join("")
          }`
        )
        .setURL(`https://animesoul.com/cards/info/${card.id}`)
        .setColor(tierSettings.color);

      if (page === 0) {
        // card image display
        embed.setImage(cardImage).setFooter("React ▶️ for more info");
      } else if (page === 1) {
        // card info & market listings
        const top = tracked
          ? await DbFetcher.fetchTopOwners(instance, card.id, "0", "5")
          : await Fetcher.fetchTopOwners(instance, card.id, "0", "5");
        const listings = await Fetcher.fetchMarketByCardId(
          instance,
          card.id,
          "0",
          "10"
        );

        const topOwners = mapped.map(
          (user) =>
            `> • \`${user.count}x ${user.count > 1 ? "issues" : "issue"}\` | ` +
            `[__**${user.username}**__](https://animesoul.com/user/${user.discord_id})`
        );
        const market = listings.map(
          (listing) =>
            `> [• \`Issue: ${listing.item.issue}\`](https://animesoul.com/market) | ` +
            `Price: \`富 ${listing.price}\` | ` +
            `Added: \`${moment(listing.date_added * 1000).fromNow()}\``
        );

        embed
          .setThumbnail(cardImage)
          .setDescription(description)
          .setImage(card.ability ? card.ability_gif : Constants.footer)
          .setFooter("React ▶️ for card owners");

        if (card.ability) {
          embed.addField(`**${card.ability_name}**`, card.ability_description);
        }
        embed
          .addField(
            "__Top Owners:__",
            topOwners.length === 0
              ? "- No one <:SShoob:783636544720207903>"
              : topOwners
          )
          .addField(
            "__Market Listings:__",
            market.length === 0 ? "- None <:SShoob:783636544720207903>" : market
          );
      } else {
        // card issue list
        const pnum = page - 2;
        if ((pages === 0 && pnum > 0) || (pages !== 0 && pnum >= pages))
          return null;
        const offset = pnum * 10;

        let issues = [];
        if (tracked) {
          issues = await DbFetcher.fetchOwners(instance, card.id, offset, "10");
        } else {
          const entries = await Fetcher.fetchOwners(
            instance,
            card.id,
            offset,
            "10"
          );
          for (const claim of entries) {
            const history = claim.trade_history;
            const username = history[history.length - 1].username;
            issues.push({
              discord_id: claim.discord_id,
              username,
              issue: claim.issue,
            });
          }
        }

        const owners = issues.map(
          (claim) =>
            `> • \`Issue: ${claim.issue}\` | ` +
            `[__**${claim.username}**__](https://animesoul.com/user/${claim.discord_id})`
        );

        embed
          .setThumbnail(cardImage)
          .setDescription(description)
          .addField(
            `__${isGlobal ? "Stored Card Claims" : "Card Owners"}:__`,
            owners.length === 0
              ? "- No one <:SShoob:783636544720207903>"
              : owners
          )
          .setImage(Constants.footer)
          .setFooter(
            (pages > 1 ? `Page: ${pnum + 1}/${pages} | ` : "") +
              (pnum + 1 < pages ? "React ▶️ for next page | " : "") +
              "React ◀️ to go back"
          );
      }

      return embed;
    },
    false,
    botMessage
  );
};
