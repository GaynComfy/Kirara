const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { cardId, mention, userId } = require("../../utils/regexUtils");
const { tierInfo } = require("../../utils/cardUtils");
const Constants = require("../../utils/Constants.json");

const fusedUser = {
  id: "1",
  username: "Fusion",
  displayAvatarURL: () =>
    "https://discord.com/assets/18126c8a9aafeefa76bbb770759203a9.png",
};

const ONE_OR_FUSED = ["1", "fused"];
const EVENT = ["event", "e"];

const info = {
  name: "inventory",
  aliases: ["inv"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  usage: "inventory [@user] [event] [tier] [card name/ID/link]",
  examples: [
    "inventory @Alycans",
    "inv @Liz3 t6",
    "inv @JeDaYoshi t6 Rin",
    "inv",
  ],
  description:
    "Fetch a users inventory\nNote that this will display information about a user!",
};

module.exports = {
  execute: async (instance, message, args) => {
    let user =
      message.mentions.users.first() || // first mention on the message
      (args.length >= 1 &&
        ((ONE_OR_FUSED.includes(args[0]) && fusedUser) || // if first argument is 1 or fused
          (userId.test(args[0]) && // if it's a user ID
            (await instance.client.users.fetch(args[0]).catch(() => {}))))); // and we can fetch it
    if (
      args.length >= 1 &&
      (ONE_OR_FUSED.includes(args[0]) ||
        mention.test(args[0]) ||
        userId.test(args[0]))
    )
      args.shift();

    if (!user) user = message.author;

    const isEvent = args.length >= 1 && EVENT.includes(args[0]);

    if (isEvent) args.shift();
    if (isEvent && args.length === 0) return false;

    const hasTier =
      args.length >= 1 && Constants.allTiers.includes(args[0].toLowerCase());
    const hasCardId = args.length >= 1 && cardId.test(args[0]);

    if (isEvent && hasTier && args.length === 1) return false;

    let tier = hasTier ? args.shift()[1].toUpperCase() : "all";
    const card_id = hasCardId ? cardId.exec(args.shift())[2] : null;
    let card = null;
    if (card_id) {
      card =
        (await Fetcher.fetchById(instance, card_id, isEvent)) ||
        (!isEvent
          ? await Fetcher.fetchById(instance, card_id, !isEvent)
          : null);
    } else if (args.length >= 1) {
      const name = args.join(" ");
      card =
        (await Fetcher.fetchByName(instance, name, tier, isEvent)) ||
        (name.indexOf("") !== -1
          ? await Fetcher.fetchByName(
              instance,
              [...args.slice(-1), ...args.slice(0, -1)].join(" "),
              tier,
              isEvent
            )
          : null);
    }
    if (card === null && (card_id || args.length >= 1)) {
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send(embed);
      return null;
    }
    if (card) tier = card.tier;
    let last = -1;
    return createPagedResults(message, Infinity, async page => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const result = await Fetcher.fetchInventory(
        instance,
        user.id,
        tier !== "all" ? tier : null,
        offset,
        "8",
        card ? card.id : null
      );
      if (result.length === 0 && last === -1) {
        last = page - 1;
        if (last === -1) last = 0;
      } else if (result.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;
      const tierSettings = tier !== "all" ? tierInfo[`T${tier}`] : null;
      const embed = new MessageEmbed()
        .setAuthor(
          `${user.username}'s Inventory`,
          user.displayAvatarURL({ dynamic: true })
        )
        .setColor(tier !== "all" ? tierSettings.color : Color.default)
        .setURL(`https://animesoul.com/user/${user.id}`)
        .setFooter(
          (!singlePage
            ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
            : "") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : "")
        );
      if (card)
        embed.setThumbnail(encodeURI(card.image_url).replace(".webp", ".gif"));
      embed.addField(
        `•   __Cards__`,
        result.length > 0
          ? result.map(
              e =>
                `> \`T${e.tier.toUpperCase()}\` • ` +
                `[\`${e.name}\`](https://animesoul.com/cards/info/${e.card_id}) ` +
                `| \`Issue: ${e.issue}\``
            )
          : "- No cards <:SShoob:783636544720207903>"
      );
      if (last === 0) {
        await message.channel.send(embed);
        return false;
      }
      return embed;
    });
  },
  info,
};
