// this is probably the most complex command in the bot

const moment = require("moment");
const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../../utils/cardUtils");
const { createMessagePagedResults } = require("../../utils/PagedResults");

const info = {
  name: "auctions",
  aliases: ["auc", "auction"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

const cardId = /^(https?:\/\/animesoul\.com\/cards\/info\/)([a-z0-9]{24})$/;
const aucId = /^(https?:\/\/animesoul\.com\/auction\/)?([a-z0-9]{24})$/;
const space = / /; // lol

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
      ` | Started \`${moment(item.date_added).fromNow()}\``
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
  const localAuc = query.rows.length > 0 ? query.rows[0] : null;
  if (!asAuc && !localAuc)
    return new MessageEmbed()
      .setDescription(
        `<:Sirona_NoCross:762606114444935168> This auction wasn't found.`
      )
      .setColor(Color.red);
  const tier = (asAuc && asAuc.tier) || localAuc.tier;

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
    .addField(
      "Starting Bid",
      `\`富 ${Math.round(localAuc.bn / 5) + localAuc.minimum}\``,
      true
    )
    .addField("Buy Now", `\`富 ${localAuc.bn}\``, true)
    .addField("Min. Increment", `\`+富 ${localAuc.minimum}\``, true)
    .addField("Added", moment(localAuc.date_added).fromNow(), true)
    .addField(
      (asAuc ? asAuc.date_ending * 1000 : localAuc.date_ending) > Date.now()
        ? "Ending"
        : "Ended",
      moment(asAuc ? asAuc.date_ending * 1000 : localAuc.date_ending).fromNow(),
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
        (bid) =>
          `> • \`富 ${bid.bid_amount}\` | ` +
          `[${bid.username}](https://animesoul.com/user/${bid.discord_id}) | ` +
          `\`${moment(bid.date_added * 1000).fromNow()}\``
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
      args.length >= 1 ? allowed.includes(args[0].toLowerCase()) : false;
    const hasCardId = args.length >= 1 ? cardId.test(args[0]) : false;
    const hasAucId =
      args.length >= 1 && !hasCardId ? aucId.test(args[0]) : false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : null;
    const auc_id = hasAucId ? aucId.exec(args.shift())[2] : null;
    let card_id = hasCardId ? cardId.exec(args.shift())[2] : null;
    if (!auc_id && !card_id && args.length >= 1) {
      const name = args.join(" ");
      const card =
        (await Fetcher.fetchByName(instance, name, tier ? tier : "all")) ||
        (space.test(name)
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
        return await message.channel.send({ embed });
      }
      card_id = card.id;
    }
    if ((auc_id || tier) && !card_id && args.length >= 1) return false;
    if (auc_id)
      return await message.channel.send(await computeAuction(instance, auc_id));

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

    return await createMessagePagedResults(message, Infinity, handler, true);
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
