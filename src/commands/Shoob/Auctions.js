// this is probably the most complex command in the bot

const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const { tierInfo } = require("../../utils/cardUtils");
const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const sendError = require("../../utils/SendError");

const info = {
  name: "auctions",
  aliases: ["auc"],
  matchCase: false,
  category: "Shoob",
  cooldown: 25,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

const cardId = /^(https?:\/\/animesoul\.com\/auction\/)?([a-z0-9]{24})$/;
const space = / /; // lol
const digit = /^[1-8]$/;
const userMap = {};
const command = (msg) => {
  const m = msg.toLowerCase();
  return (
    ((m === "start" || m === "s") && "start") ||
    ((m === "back" || m === "b") && "back") ||
    ((m === "next" || m === "n") && "next") ||
    ((m === "refresh" || m === "r") && "refresh") ||
    ((m === "exit" || m === "e") && "exit") ||
    (digit.test(m) && parseInt(m))
  );
};
const collectorOpts = { idle: 25 * 1000 };

// why is this on a different function? who knows
const getListings = async (instance, page, tier, card_id) => {
  let query;

  if (card_id)
    query = await instance.database.pool.query(
      "SELECT * FROM AUCTIONS WHERE active=true AND card_id=$1 ORDER BY id DESC LIMIT 8 OFFSET $2",
      [card_id, page * 8]
    );
  else if (tier)
    // not working, we don't get tier from the auction events. TODO change
    query = await instance.database.pool.query(
      "SELECT * FROM AUCTIONS WHERE active=true AND tier=$1 ORDER BY id DESC LIMIT 8 OFFSET $2",
      [tier, page * 8]
    );
  else
    query = await instance.database.pool.query(
      "SELECT * FROM AUCTIONS WHERE active=true ORDER BY id DESC LIMIT 8 OFFSET $1",
      [page * 8]
    );

  return query.rows;
};

const computeListings = async (instance, page, tier, card_id) => {
  const recent = await getListings(instance, page, tier, card_id);
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
  if (cards.length === 0 && page > 0) return { embed: null, recent: [] };

  const embed = new MessageEmbed()
    .setTitle(title)
    .setURL("https://animesoul.com/auction")
    .setColor(colour)
    .addField(
      `__Latest Auctions:__`,
      cards.length === 0 ? "- None <:SShoob:783636544720207903>" : cards
    )
    .setFooter(
      `Page: ${page + 1} | View auc. sending its number | ` +
        `Send \`next\` for next page` +
        (page !== 0 ? " | `back` to go back" : "")
    );

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
  const tier = asAuc ? asAuc.tier : null || localAuc.tier;

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
      "Ending",
      moment(asAuc ? asAuc.date_ending * 1000 : localAuc.date_ending).fromNow(),
      true
    )
    .addField("Owner", localAuc.username, true);

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
    const hasTier =
      args.length >= 1 ? allowed.includes(args[0].toLowerCase()) : false;
    const hasAucId = args.length >= 1 ? cardId.test(args[0]) : false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : null;
    const aucId = hasAucId ? cardId.exec(args.shift())[2] : null;
    let card_id = null;
    if (!aucId && args.length >= 1) {
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
    if ((aucId || tier) && !card_id && args.length >= 1) return false;
    const s = Symbol();
    userMap[message.author.id] = s;
    if (aucId)
      return await message.channel.send(await computeAuction(instance, aucId));

    let recent;
    let aucInfo = false;
    let page = 0;

    const handler = async (p) => {
      // allow refreshing but that's it, you need to exit first
      if (aucInfo !== false && p !== page) return null;
      if (aucInfo !== false) {
        const auc = await computeAuction(instance, aucInfo);
        auc.setFooter(
          "Send `exit` to go back to listings | `refresh` to refresh auction"
        );
        return auc;
      }

      const query = await computeListings(instance, p, tier, card_id);
      if (query.recent.length !== 0) recent = query.recent;

      return query.embed;
    };

    // paged results except that using both reaction and message collectors are a mess
    // so here you go, a collector based off pure message commands. please help me
    const filter = (m) =>
      m.author.id == message.author.id && command(m.content);
    const msg = await message.channel.send(await handler(page));
    msg.channel
      .createMessageCollector(filter, collectorOpts)
      .on("collect", async (m) => {
        if (s !== userMap[message.author.id]) return;
        let newPage = page;
        const cmd = command(m.content);
        switch (cmd) {
          case "start":
            newPage = 0;
            break;
          case "back":
            newPage = Math.max(page - 1, 0);
            break;
          case "next":
            newPage = page + 1;
            break;
          case "exit":
            aucInfo = false;
            break;
          default:
            if (typeof cmd === "number" && aucInfo === false) {
              // go to an auction!
              const index = cmd - 1;
              aucInfo = recent[index] ? recent[index].auction_id : false;
            }
            break;
        }
        try {
          const res = await handler(newPage);
          if (res) {
            msg.edit(res);
            page = newPage;
          }
        } catch (err) {
          sendError(msg.channel);
          console.error(err);
        }
        m.delete();
      });
    return true;
  },
  info,
  help: {
    usage: "auctions [[tier] [name]/[auction ID/link]]",
    examples: [
      "auctions",
      "auc t6",
      "auc t5 Konata Izumi",
      "auc 5fd246b9c797c534105c637b",
      "auc https://animesoul.com/auction/5fd41e3f8030b66973438e3a",
    ],
    description: "Watch active auctions and their information live!",
  },
};
