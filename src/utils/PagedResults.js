const sendError = require("./SendError");
const Color = require("./Colors.json");
const { MessageEmbed } = require("discord.js");

const FAST_REVERSE_SYMBOL = "\u23ea";
const BACK_SYMBOL = "\u25c0\ufe0f";
const FORWARD_SYMBOL = "\u25b6\ufe0f";
const FAST_FORWARD_SYMBOL = "\u23e9";
const REPEAT_SYMBOL = "\ud83d\udd01";
const ALL_SYMBOLS = [
  FAST_REVERSE_SYMBOL,
  BACK_SYMBOL,
  FORWARD_SYMBOL,
  FAST_FORWARD_SYMBOL,
  REPEAT_SYMBOL,
];

const digit = /^[1-8]$/;

const collectorOpts = { idle: 45 * 1000 };
const userMap = {};
const embed = new MessageEmbed()
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> An unexpected error has occurred on command execution."
  )
  .setColor(Color.red);

const command = (msg, refresh) => {
  const m = msg.toLowerCase();
  return (
    ((m === "start" || m === "s") && "start") ||
    ((m === "back" || m === "b") && "back") ||
    ((m === "next" || m === "n") && "next") ||
    ((m === "exit" || m === "e") && "exit") ||
    (refresh && (m === "refresh" || m === "r") && "refresh") ||
    (digit.test(m) && parseInt(m))
  );
};

const createPagedResults = async (
  message,
  maxPages,
  getMessageForPage,
  refresh = false,
  botMessage = null
) => {
  const emojiFilter = (r, user) =>
    ALL_SYMBOLS.includes(r.emoji.name) && user.id === message.author.id;
  let page = 0;
  let root = embed;
  try {
    root = await getMessageForPage(page, message.author);
  } catch (err) {
    console.error(err);
    sendError(message.channel);
    return false;
  }

  // we are expecting for the function to handle it.
  if (!root) return null;

  const sentMessage = botMessage
    ? await botMessage.edit(root)
    : await message.channel.send(root);

  try {
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

    return sentMessage
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
            if (res !== true) sentMessage.edit(res);
            page = newPage;
          }
        } catch (err) {
          console.error(err);
          sentMessage.edit(embed);
        }
        r.users.remove(user);
      })
      .on("end", () => sentMessage.reactions.removeAll());
  } catch (err) {
    console.error(err);
    if (sentMessage) sentMessage.edit(embed);
    else sendError(message.channel);
  }
};

const createMessagePagedResults = async (
  message,
  maxPages,
  getMessageForPage,
  refresh = false
) => {
  const s = Symbol();
  userMap[`${message.channel.id}:${message.author.id}`] = s;
  const filter = (m) =>
    m.author.id == message.author.id && // it's sent by the user who requested the list
    s === userMap[`${message.channel.id}:${message.author.id}`] && // no other command is running with us
    command(m.content, refresh); // is a valid command
  let page = 0;
  let root = embed;
  let inSubPage = false;

  try {
    root = await getMessageForPage(page, message.author, inSubPage, null);
  } catch (err) {
    console.error(err);
    sendError(message.channel);
    return false;
  }

  // we are expecting for the function to handle it.
  if (!root) return null;

  const sentMessage = await message.channel.send(root);

  try {
    if (maxPages < 2) {
      return sentMessage;
    }

    sentMessage.channel
      .createMessageCollector(filter, collectorOpts)
      .on("collect", async (m, user) => {
        let newPage = page;
        let index = inSubPage;
        const cmd = command(m.content);
        switch (cmd) {
          case "start":
            newPage = 0;
            break;
          case "back":
            newPage = Math.max(page - 1, 0);
            break;
          case "next":
            newPage = Math.min(page + 1, maxPages - 1);
            break;
          case "forward":
            if (maxPages !== Infinity) newPage = maxPages - 1;
            else return;
            break;
          case "exit":
            index = false;
            break;
          default:
            if (typeof cmd === "number" && inSubPage === false) {
              index = cmd - 1;
            } else {
              return;
            }
            break;
        }
        try {
          const res = await getMessageForPage(
            newPage,
            user,
            index,
            sentMessage
          );
          if (res) {
            if (res !== true) sentMessage.edit(res);
            page = newPage;
            inSubPage = index;
          }
        } catch (err) {
          sendError(sentMessage.channel);
          console.error(err);
        }
        m.delete();
      })
      .on("end", () => {
        if (s === userMap[`${message.channel.id}:${message.author.id}`])
          delete userMap[`${message.channel.id}:${message.author.id}`];
      });
  } catch (err) {
    console.error(err);
    if (sentMessage) sentMessage.edit(embed);
    else sendError(message.channel);
  }
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

module.exports = {
  createPagedResults,
  createMessagePagedResults,
  pageThroughList,
  pageThroughCollection,
};
