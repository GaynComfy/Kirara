const sendError = require("./SendError");

const BACK_SYMBOL = "\u25c0️";
const FORWARD_SYMBOL = "\u25b6";

const collectorOpts = { idle: 30 * 1000 };

const createPagedResults = async (message, maxPages, getMessageForPage) => {
  const nextFilter = (reaction, user) =>
    reaction.emoji.name === FORWARD_SYMBOL && user.id === message.author.id;
  const backFilter = (reaction, user) =>
    reaction.emoji.name === BACK_SYMBOL && user.id === message.author.id;
  let page = 0;
  const root = await getMessageForPage(page, message.author);
  return message.channel.send(root).then((sentMessage) => {
    if (maxPages < 2) {
      return sentMessage;
    }

    sentMessage
      .react(BACK_SYMBOL)
      .then(() => sentMessage.react(FORWARD_SYMBOL));

    sentMessage
      .createReactionCollector(nextFilter, collectorOpts)
      .on("collect", async (r, user) => {
        const newPage = Math.min(page + 1, maxPages - 1);
        if (newPage === page) return r.users.remove(user);
        try {
          const res = await getMessageForPage(newPage, user);
          if (res) {
            sentMessage.edit(res);
            page = newPage;
          }
        } catch (err) {
          sendError(sentMessage.channel);
          console.error(err);
        }
        r.users.remove(user);
      });

    sentMessage
      .createReactionCollector(backFilter, collectorOpts)
      .on("collect", async (r, user) => {
        const newPage = Math.max(page - 1, 0);
        if (newPage === page) return r.users.remove(user);
        try {
          const res = await getMessageForPage(newPage, user);
          if (res) {
            sentMessage.edit(res);
            page = newPage;
          }
        } catch (err) {
          sendError(sentMessage.channel);
          console.error(err);
        }
        r.users.remove(user);
      });

    return sentMessage;
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
