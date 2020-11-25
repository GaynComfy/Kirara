const BACK_SYMBOL = "\u25c0️";
const FORWARD_SYMBOL = "\u25b6";

const collectorOpts = { idle: 30 * 1000 };

const createPagedResults = (message, maxPages, getMessageForPage) => {
  const nextFilter = (reaction, user) =>
    reaction.emoji.name === FORWARD_SYMBOL && user.id === message.author.id;
  const backFilter = (reaction, user) =>
    reaction.emoji.name === BACK_SYMBOL && user.id === message.author.id;

  let page = 0;
  return message.channel
    .send(getMessageForPage(page, message.author))
    .then((sentMessage) => {
      if (maxPages < 2) {
        return sentMessage;
      }

      sentMessage
        .react(BACK_SYMBOL)
        .then(() => sentMessage.react(FORWARD_SYMBOL));

      sentMessage
        .createReactionCollector(nextFilter, collectorOpts)
        .on("collect", (r, user) => {
          page = Math.min(page + 1, maxPages - 1);
          sentMessage.edit(getMessageForPage(page, user));
          r.users.remove(user);
        });

      sentMessage
        .createReactionCollector(backFilter, collectorOpts)
        .on("collect", (r, user) => {
          page = Math.max(page - 1, 0);
          sentMessage.edit(getMessageForPage(page, user));
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
