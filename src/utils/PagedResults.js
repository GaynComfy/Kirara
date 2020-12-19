const sendError = require("./SendError");
const Color = require("./Colors.json");
const { MessageEmbed } = require("discord.js");

const FAST_REVERSE_SYMBOL = "\u23ea";
const BACK_SYMBOL = "\u25c0";
const FORWARD_SYMBOL = "\u25b6";
const FAST_FORWARD_SYMBOL = "\u23e9";
const REPEAT_SYMBOL = "\ud83d\udd01";
const ALL_SYMBOLS = [
  FAST_REVERSE_SYMBOL,
  BACK_SYMBOL,
  FORWARD_SYMBOL,
  FAST_FORWARD_SYMBOL,
  REPEAT_SYMBOL,
];

const collectorOpts = { idle: 45 * 1000 };
const embed = new MessageEmbed()
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> An unexpected error has occurred on command execution."
  )
  .setColor(Color.red);

const createPagedResults = async (
  message,
  maxPages,
  getMessageForPage,
  refresh = false
) => {
  const emojiFilter = (r, user) =>
    ALL_SYMBOLS.includes(r.emoji.name) && user.id === message.author.id;
  let page = 0;
  try {
    const root = await getMessageForPage(page, message.author);
  } catch (err) {
    console.error(err);
    sendError(message.channel);
    return false;
  }
  return message.channel
    .send(root)
    .then((sentMessage) => {
      if (maxPages < 2) {
        return sentMessage;
      }

      sentMessage
        .react(FAST_REVERSE_SYMBOL)
        .then(() => sentMessage.react(BACK_SYMBOL))
        .then(() => sentMessage.react(FORWARD_SYMBOL))
        .then(
          () => maxPages !== Infinity && sentMessage.react(FAST_FORWARD_SYMBOL)
        )
        .then(() => refresh && sentMessage.react(REPEAT_SYMBOL));

      sentMessage
        .createReactionCollector(emojiFilter, collectorOpts)
        .on("collect", async (r, user) => {
          let newPage = page;
          switch (r.emoji.name) {
            case FAST_REVERSE_SYMBOL:
              newPage = 0;
              break;
            case BACK_SYMBOL:
              newPage = Math.max(page - 1, 0);
              break;
            case FORWARD_SYMBOL:
              newPage = Math.min(page + 1, maxPages - 1);
              break;
            case FAST_FORWARD_SYMBOL:
              if (maxPages !== Infinity) newPage = maxPages - 1;
              else return;
              break;
          }
          if (newPage === page && !refresh) return r.users.remove(user);

          try {
            const res = await getMessageForPage(newPage, user);
            if (res) {
              sentMessage.edit(res);
              page = newPage;
            }
          } catch (err) {
            console.error(err);
            sentMessage.edit(embed);
          }
          r.users.remove(user);
        })
        .on("end", () => sentMessage.reactions.removeAll());

      return sentMessage;
    })
    .catch((err) => {
      console.error(err);
      sendError(message.channel);
    });
};

const pageThroughList = (message, list, mapToMessage, perPage = 10) => {
  const numPages = Math.ceil(list.length / perPage);

  return createPagedResults(message, numPages, (page, user) => {
    const view = list.slice(page * perPage, page * perPage + perPage);
    return mapToMessage(view, { index: page, total: numPages, perPage, user });
  });
};

const pageThroughCollection = (
  message,
  collection,
  mapToMessage,
  perPage = 10
) => {
  return pageThroughList(message, collection.array(), mapToMessage, perPage);
};

module.exports = { createPagedResults, pageThroughList, pageThroughCollection };
