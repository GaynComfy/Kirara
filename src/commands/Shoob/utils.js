// yes I definitely didn't move all of this to a file just to re-use
// the same code in both Card and Search, considering no need was needed.
const dayjs = require("dayjs");
const Fetcher = require("../../utils/CardFetcher");
const DbFetcher = require("../../utils/DbFetcher");
const Constants = require("../../utils/Constants.json");
const { EmbedBuilder } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

dayjs.extend(require("dayjs/plugin/relativeTime"));

const eventRegex = /(Chinese New Year|Summer|Halloween|Christmas)/;

exports.getCard = async (instance, message, card, tracked, botMessage) => {
  if (card === null) return false;
  const tierSettings = tierInfo[`T${card.tier}`];
  const claims = tracked
    ? await DbFetcher.fetchCardCount(instance, card.id)
    : await Fetcher.fetchCardCount(instance, card.id);
  const series = (card.series || []).filter(
    s => s.toLowerCase() !== card.name.toLowerCase()
  );
  let event = null;
  let source = "-";
  if (card.event) {
    const e = series.filter(s => s.match(eventRegex) !== null);
    let eventIndex = -1;
    if (e.length === 1) {
      eventIndex = series.indexOf(e[0]);
      event = e[0];
    } else {
      event = series[series.length - 1];
    }

    if (eventIndex === 0) {
      // Those for some reason have the source on the last tag
      source = series[series.length - 1];
    } else {
      // And those on the first one
      source = series[0];
    }
  }
  const batch = series.find(
    c => c.startsWith("Batch ") && c.trim() !== "Batch Release"
  );
  const creators = card.creators || [];
  const makers = creators
    .filter(c => c.type === "maker")
    .map(maker => `[__**${maker.name}**__](${maker.link})`);
  const artists = creators
    .filter(c => c.type === "artist")
    .map(artist => `[__**${artist.name}**__](${artist.link})`);
  const cardImage = encodeURI(card.image_url).replace(".webp", ".gif");
  const description =
    `\`Tier: ${card.tier}\`\n` +
    `\`Highest Issue: ${card.claim_count}\`\n` +
    `\`Source: ${source || "-"}\`` +
    (event ? `\n\`Event: ${event.trim()}\`` : "") +
    (batch ? `\n\`${batch.trim()}\`` : "") +
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
  return createPagedResults(
    message,
    2 + (pages > 0 ? pages : 1),
    async page => {
      const embed = new EmbedBuilder()
        .setTitle(
          `${tierSettings.emoji}  •  ${card.name}  •  ${
            card.tier === "S" ? "S" : "★".repeat(card.tier)
          }`
        )
        .setURL(`https://shoob.gg/cards/info/${card.id}`)
        .setColor(tierSettings.color);

      switch (page) {
        case 0: {
          // card image display
          embed
            .setImage(cardImage)
            .setFooter({ text: "React ▶️ for more info" });
          break;
        }
        case 1: {
          // card info & market listings
          const [top, listings] = await Promise.all([
            tracked
              ? DbFetcher.fetchTopOwners(instance, card.id, "0", "5")
              : Fetcher.fetchTopOwners(instance, card.id, "0", "5"),
            Fetcher.fetchMarketByCardId(instance, card.id, "0", "10"),
          ]);

          const topOwners = top.map(
            user =>
              `> • \`${user.count}x ${
                user.count > 1 ? "issues" : "issue"
              }\` | ` +
              `[__**${user.username}**__](https://shoob.gg/user/${user.discord_id})`
          );
          const market = listings.map(
            listing =>
              `> [• \`Issue: ${listing.item.issue}\`](https://shoob.gg/market) | ` +
              `Price: \`富 ${listing.price}\` | ` +
              `Added: \`${dayjs(listing.date_added * 1000).fromNow()}\``
          );

          embed
            .setThumbnail(cardImage)
            .setDescription(description)
            .setImage(card.ability ? card.ability_gif : Constants.footer)
            .setFooter({ text: "React ▶️ for card owners" });

          const fields = [];

          if (card.ability) {
            fields.push({
              name: `**${card.ability_name}**`,
              value: card.ability_description,
            });
          }
          embed.addFields([
            ...fields,
            {
              name: "__Top Owners:__",
              value:
                topOwners.length === 0
                  ? "- No one <:Shoob:910973650042236938>"
                  : topOwners.join("\n"),
            },
            {
              name: "__Market Listings:__",
              value:
                market.length === 0
                  ? "- None <:Shoob:910973650042236938>"
                  : market.join("\n"),
            },
          ]);
          break;
        }
        default: {
          // card issue list
          const pnum = page - 2;
          if ((pages === 0 && pnum > 0) || (pages !== 0 && pnum >= pages))
            return null;
          const offset = pnum * 10;

          let issues = [];
          if (tracked) {
            issues = await DbFetcher.fetchOwners(
              instance,
              card.id,
              offset,
              "10"
            );
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
            claim =>
              `> • \`Issue: ${claim.issue}\` | ` +
              `[__**${claim.username}**__](https://shoob.gg/user/${claim.discord_id})`
          );

          embed
            .setThumbnail(cardImage)
            .setDescription(description)
            .addFields([
              {
                name: `__${tracked ? "Stored Card Claims" : "Card Owners"}:__`,
                value:
                  owners.length === 0
                    ? "- No one <:Shoob:910973650042236938>"
                    : owners.join("\n"),
              },
            ])
            .setImage(Constants.footer)
            .setFooter({
              text:
                (pages > 1 ? `Page: ${pnum + 1}/${pages} | ` : "឵") +
                (pnum + 1 < pages ? "React ▶️ for next page | " : "") +
                "React ◀️ to go back",
            });
        }
      }

      return embed;
    },
    false,
    botMessage
  );
};
