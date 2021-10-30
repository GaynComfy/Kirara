// this is probably the most complex command in the bot

const dayjs = require("dayjs");
const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../../utils/cardUtils");
const { createMessagePagedResults } = require("../../utils/PagedResults");
const { aucId, cardId } = require("../../utils/regexUtils");
const Constants = require("../../utils/Constants.json");

dayjs.extend(require("dayjs/plugin/relativeTime"));

const info = {
  name: "auctions",
  aliases: ["auc", "auction"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
};

// why is this on a different function? who knows
const getListings = async (instance, page, tier, card_id, active) => {
  let query;

  if (card_id)
    query = await instance.database.pool.query(
      `SELECT * FROM AUCTIONS WHERE ${
        active ? "active=true AND " : ""
      }card_id=$1 ORDER BY id DESC LIMIT 8 OFFSET $2`,
      [card_id, page * 8]
    );
  else if (tier)
    query = await instance.database.pool.query(
      `SELECT * FROM AUCTIONS WHERE ${
        active ? "active=true AND " : ""
      }tier=$1 ORDER BY id DESC LIMIT 8 OFFSET $2`,
      [tier, page * 8]
    );
  else
    query = await instance.database.pool.query(
      `SELECT * FROM AUCTIONS ${
        active ? "WHERE active=true " : ""
      }ORDER BY id DESC LIMIT 8 OFFSET $1`,
      [page * 8]
    );

  return query.rows;
};

const computeListings = async (instance, page, tier, card_id, active) => {
  const recent = await getListings(instance, page, tier, card_id, active);
  if (recent.length === 0 && page === 0) {
    const embed = new MessageEmbed()
      .setDescription(
        `<:Sirona_NoCross:762606114444935168> No active auctions${
          card_id ? " for this card" : ""
        }!`
      )
      .setColor(Color.red);
    return { embed, recent: [] };
  }
  if (recent.length === 0) return { embed: null, recent: [] };

  const title =
    tier && !card_id
      ? `${tierInfo[`T${tier}`].emoji} Auctions: Most recent ` +
        `T${tier} entries`
      : "<:Flame:783439293506519101> Auctions: Most recent entries";
  const colour = tier ? tierInfo[`T${tier}`].color : Color.default;
  const cards = recent.map(
    (item, i) =>
      `> **${i + 1}.** \`T${item.tier || " "}\` •` +
      ` [\`${item.card_name.substr(0, 15)}` +
      ` V${item.version}\`](https://animesoul.com/auction/${item.auction_id})` +
      ` | Started \`${dayjs(item.date_added).fromNow()}\``
  );

  const embed = new MessageEmbed()
    .setTitle(title)
    .setURL("https://animesoul.com/auction")
    .setColor(colour)
    .addField(
      `__${active ? "Active" : "Latest"} Auctions:__`,
      cards.length === 0 ? "- None <:SShoob:783636544720207903>" : cards
    )
    .setFooter(
      `Page: ${page + 1} | ` +
        `Send "next" for next page` +
        (page !== 0 ? ` | "back" to go back` : "")
    );

  if (cards.length !== 0) {
    embed.setDescription(
      `✏️ Send **${
        cards.length > 2 ? `1-${cards.length}` : "1"
      }** to view a specific auction.`
    );
  }
  if (card_id) embed.setThumbnail(`https://animesoul.com/api/cardr/${card_id}`);

  return { embed, recent };
};

const computeAuction = async (instance, aid) => {
  // we need to fetch the auction from the Anime Soul API for live data
  let asAuc = null;
  try {
    asAuc = await Fetcher.fetchAuctionById(instance, aid);
  } catch (err) {
    if (!(err.response && err.response.status === 404)) console.error(err);
  }
  // and the local database for stored auctions (until they stop deleting them, perhaps?)
  const query = await instance.database.pool.query(
    "SELECT * FROM AUCTIONS WHERE auction_id=$1",
    [aid]
  );
  const localAucResult = query.rows.length > 0 ? query.rows[0] : null;
  const localAuc = localAucResult || asAuc || null;
  if (!localAuc)
    return new MessageEmbed()
      .setDescription(
        `<:Sirona_NoCross:762606114444935168> This auction wasn't found.`
      )
      .setColor(Color.red);
  const tier = localAuc.tier;
  let bidders = 0;
  if (asAuc) {
    bidders = new Set(...asAuc.bidders.map(bid => bid.discord_id)).size;
  }

  // holy mess
  const embed = new MessageEmbed()
    .setTitle(
      `${tier ? tierInfo[`T${tier}`].emoji : "<:Flame:783439293506519101>"}` +
        `  •  Auction: ${tier ? `T${tier} ` : ""}${localAuc.card_name}` +
        `  •  V${localAuc.version}`
    )
    .setURL(`https://animesoul.com/auction/${aid}`)
    .setThumbnail(`https://animesoul.com/api/cardr/${localAuc.card_id}`)
    .setColor(tier ? tierInfo[`T${tier}`].color : Color.default)
    .setDescription(!asAuc ? "⏱️ **This auction is no longer active.**\n" : "")
    .addField("Starting Bid", `\`富 ${Math.round(localAuc.bn / 5)}\``, true)
    .addField("Buy Now", `\`富 ${localAuc.bn}\``, true)
    .addField("Bidders", `\`${bidders}\``, true)
    .addField(
      "Added",
      dayjs(
        asAuc && !localAucResult ? asAuc.date_added * 1000 : localAuc.date_added
      ).fromNow(),
      true
    )
    .addField(
      (asAuc ? asAuc.date_ending * 1000 : localAuc.date_ending) > Date.now()
        ? "Ending"
        : "Ended",
      dayjs(asAuc ? asAuc.date_ending * 1000 : localAuc.date_ending).fromNow(),
      true
    )
    .addField(
      "Owner",
      `[${localAuc.username}](https://animesoul.com/user/${localAuc.discord_id})`,
      true
    );

  if (asAuc) {
    const lastBids = asAuc.bidders
      .reverse()
      .slice(0, 5)
      .map(
        bid =>
          `> • \`富 ${bid.bid_amount}\` | ` +
          `[${bid.username}](https://animesoul.com/user/${bid.discord_id}) | ` +
          `\`${dayjs(bid.date_added * 1000).fromNow()}\``
      );
    embed.addField(
      `${asAuc.bids} ${asAuc.bids === 1 ? "Bid" : "Bids"}`,
      lastBids.length === 0 ? "-" : lastBids
    );
  }

  return embed;
};

module.exports = {
  execute: async (instance, message, args) => {
    const hasAll =
      args.length >= 1
        ? args[0].toLowerCase() === "all" || args[0].toLowerCase() === "a"
        : false;
    if (hasAll) args.shift();
    const hasTier =
      args.length >= 1
        ? Constants.allTiers.includes(args[0].toLowerCase())
        : false;
    const hasCardId = args.length >= 1 ? cardId.test(args[0]) : false;
    const hasAucId = args.length >= 1 ? aucId.test(args[0]) : false;
    const caId = hasCardId || hasAucId ? args.shift() : null;
    const tier = hasTier ? args.shift()[1].toUpperCase() : null;
    let card_id = hasCardId ? cardId.exec(caId)[2] : null;
    let auc_id = hasAucId ? aucId.exec(caId)[2] : null;
    if (auc_id && card_id) {
      // we were given an ID, but we don't know what is it for. let's check by querying all of it!
      // ToDo: maybe we should NOT use a lot of promises, but it's the best bet we have right now
      // after this we can check if we can query database and such, but we're fine atm

      const checkId = (
        await Promise.all([
          Fetcher.fetchAuctionById(instance, auc_id),
          Fetcher.fetchById(instance, card_id, false),
          Fetcher.fetchById(instance, card_id, true),
        ])
      ).filter(c => c !== null);

      if (checkId.length !== 1) {
        console.error(
          `! We didn't end up with 1 auction or card while identifying ID: ${JSON.stringify(
            checkId
          )} (${caId})`
        );
        return false;
      }

      const check = checkId[0];
      if (check.claim_count !== undefined) {
        // card ID to search
        auc_id = null;
      } else if (check.bids !== undefined) {
        // auction ID
        card_id = null;
      } else {
        // unknown
        throw new Error(
          `Couldn't identify if ID was either an auction or a card: ${JSON.stringify(
            check
          )} (${caId})`
        );
      }
    }

    if (!caId && args.length >= 1) {
      const name = args.join(" ");
      const card =
        (await Fetcher.fetchByName(instance, name, tier ? tier : "all")) ||
        (name.indexOf(" ") !== -1
          ? await Fetcher.fetchByName(
              instance,
              [...args.slice(-1), ...args.slice(0, -1)].join(" "),
              tier ? tier : "all"
            )
          : null);
      if (!card) {
        const embed = new MessageEmbed()
          .setDescription(
            `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
          )
          .setColor(Color.red);
        return message.channel.send({ embed });
      }
      card_id = card.id;
    }
    if ((auc_id || tier) && !card_id && args.length >= 1) return false;
    if (auc_id)
      return message.channel.send(await computeAuction(instance, auc_id));

    let recent;
    let page = 0;

    const handler = async (p, author, index) => {
      // allow refreshing but that's it, you need to exit first
      if (index !== false && p !== page) return null;
      if (index !== false) {
        const aucInfo = recent[index] ? recent[index].auction_id : false;
        if (!aucInfo) return null;
        const auc = await computeAuction(instance, aucInfo);
        auc.setFooter(
          `Send "exit" to go back to listings | "refresh" to refresh auction`
        );
        return auc;
      }
      page = p;

      const query = await computeListings(instance, p, tier, card_id, !hasAll);
      if (query.recent.length !== 0) recent = query.recent;
      if (query.recent.length === 0 && page === 0) {
        await message.channel.send(query.embed);
        return false;
      }

      return query.embed;
    };

    const coll = await createMessagePagedResults(message, Infinity, handler);
    return coll;
  },
  info,
  help: {
    usage: "auctions [all] [[tier] [name]/[card link]/[auction ID/link]]",
    examples: [
      "auctions",
      "auc t6",
      "auc all t5 Konata Izumi",
      "auc 5fd246b9c797c534105c637b",
      "auc https://animesoul.com/auction/5fd41e3f8030b66973438e3a",
      "auc a https://animesoul.com/cards/info/5fdbd604b3395a516de95394",
    ],
    description: "Watch active auctions and their information live!",
  },
};
