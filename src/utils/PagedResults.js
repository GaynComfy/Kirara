const sendError = require("./SendError");
const Color = require("./Colors.json");
const { MessageEmbed } = require("discord.js");
const { multiReact } = require("./miscUtils");

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

const userMap = {};
const embed = new MessageEmbed()
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> An unexpected error has occurred on command execution."
  )
  .setColor(Color.red);

const arr = ["start", "back", "next", "forward", "exit", "refresh"];
const command = msg => {
  const m = msg.toLowerCase();
  const entry = arr.find(e => m === e || m === e[0]);
  if (entry) return entry;
  const number = Number.parseInt(m);
  if (!Number.isNaN(number) && number <= 10 && number > 0) return msg;
  return null;
};

const createPagedResults = async (
  message,
  maxPages,
  getMessageForPage,
  refresh = false,
  botMessage = null
) => {
  let page = 0;
  let root = embed;
  let sentMessage = null;
  let running = false;

  try {
    root = await getMessageForPage(page, message.author);
    // we are expecting for the function to handle it.
    if (!root) return null;

    sentMessage = botMessage
      ? await botMessage.edit({ embeds: [root] })
      : await message.channel.send({ embeds: [root] });
    if (maxPages < 2) {
      return sentMessage;
    }

    const filter = (r, user) =>
      ALL_SYMBOLS.includes(r.emoji.name) && user.id === message.author.id;
    const reacts = [BACK_SYMBOL, FORWARD_SYMBOL];
    if (refresh) reacts.push(REPEAT_SYMBOL);
    multiReact(sentMessage, reacts).catch(() => {});

    return sentMessage
      .createReactionCollector({ filter, idle: 45 * 1000 })
      .on("collect", async (r, user) => {
        if (running === true) return;
        let newPage = page;
        switch (r.emoji.name) {
          case FAST_REVERSE_SYMBOL:
            newPage = 0;
            break;
          case BACK_SYMBOL:
            newPage = Math.max(page - 1, 0);
            if (page === newPage && page === 0 && maxPages !== Infinity) {
              newPage = maxPages - 1;
            }
            break;
          case FORWARD_SYMBOL:
            newPage = Math.min(page + 1, maxPages - 1);
            if (page === newPage && page === maxPages - 1) {
              newPage = 0;
            }
            break;
          case FAST_FORWARD_SYMBOL:
            if (maxPages !== Infinity) newPage = maxPages - 1;
            break;
        }
        if (newPage === page && !refresh)
          return r.users.remove(user).catch(() => {});

        let res;
        running = true;
        try {
          res = await getMessageForPage(newPage, user);
          if (res && res !== true) await sentMessage.edit({ embeds: [res] });
        } catch (err) {
          console.error(err);
          sentMessage.edit({ embeds: [embed] });
        }
        running = false;
        r.users.remove(user).catch(() => {});
        if (res) page = newPage;
      })
      .on("end", () => sentMessage.reactions.removeAll().catch(() => {}));
  } catch (err) {
    console.error(err);
    if (sentMessage) sentMessage.edit({ embeds: [embed] });
    else sendError(message.channel);
    return null;
  }
};

const createMessagePagedResults = async (
  message,
  maxPages,
  getMessageForPage
) => {
  const s = Symbol();
  let page = 0;
  let root = embed;
  let inSubPage = false;
  let sentMessage = null;
  let running = false;

  try {
    root = await getMessageForPage(page, message.author, inSubPage, null);

    // we are expecting for the function to handle it.
    if (!root) return null;
    userMap[`${message.channel.id}:${message.author.id}`] = s;

    sentMessage = await message.channel.send({ embeds: [root] });

    const filter = m =>
      m.author.id == message.author.id && // it's sent by the user who requested the list
      s === userMap[`${message.channel.id}:${message.author.id}`] && // no other command is running with us
      command(m.content); // is a valid command

    return sentMessage.channel
      .createMessageCollector({ filter, idle: 45 * 1000 })
      .on("collect", async (m, user) => {
        if (running === true) return;
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
            if (!Number.isNaN(cmd) && inSubPage === false) {
              index = Number.parseInt(cmd) - 1;
            } else if (inSubPage === false) {
              return;
            }
            break;
        }
        running = true;
        try {
          const res = await getMessageForPage(
            newPage,
            user,
            index,
            sentMessage
          );
          if (res) {
            if (res !== true) await sentMessage.edit({ embeds: [res] });
            page = newPage;
            inSubPage = index;
          }
        } catch (err) {
          sendError(sentMessage.channel);
          console.error(err);
        }
        running = false;
        m.delete().catch(() => {});
      })
      .on("end", () => {
        if (s === userMap[`${message.channel.id}:${message.author.id}`])
          delete userMap[`${message.channel.id}:${message.author.id}`];
      });
  } catch (err) {
    console.error(err);
    if (sentMessage) sentMessage.edit({ embeds: [embed] });
    else sendError(message.channel);
    return null;
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
) =>
  pageThroughList(
    message,
    collection.map(m => m),
    mapToMessage,
    perPage
  );

module.exports = {
  createPagedResults,
  createMessagePagedResults,
  pageThroughList,
  pageThroughCollection,
};
