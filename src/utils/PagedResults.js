const sendError = require("./SendError");
const Color = require("./Colors.json");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
//const { multiReact } = require("./miscUtils");

// const FAST_REVERSE_SYMBOL = "\u23ea";
// const BACK_SYMBOL = "\u25c0\ufe0f";
// const FORWARD_SYMBOL = "\u25b6\ufe0f";
// const FAST_FORWARD_SYMBOL = "\u23e9";
// const REPEAT_SYMBOL = "\ud83d\udd01";
// const ALL_SYMBOLS = [
//   FAST_REVERSE_SYMBOL,
//   BACK_SYMBOL,
//   FORWARD_SYMBOL,
//   FAST_FORWARD_SYMBOL,
//   REPEAT_SYMBOL,
// ];

const ACTIONS = {
  back: {
    label: "Back",
    id: "back",
  },
  forward: {
    label: "Forward",
    id: "forward",
  },
  reset: {
    label: "Reset",
    id: "reset",
  },
  end: {
    label: "End",
    id: "end",
  },
  refresh: {
    label: "Refresh",
    id: "refresh",
  },
};
const actionsToButtonRow = list => {
  const buttons = list.map(entry => {
    const e = { ...ACTIONS[entry[0]], ...(entry[1] || {}) };
    const b = new ButtonBuilder()
      .setCustomId(e.id)
      .setStyle(e.style || ButtonStyle.Primary)
      .setDisabled(e.disabled === true);
    if (e.label) b.setLabel(e.label);
    if (e.emote) b.setEmoji(e.emote);
    return b;
  });
  return new ActionRowBuilder().addComponents(...buttons);
};
const collectorOpts = { idle: 45 * 1000 };

const userMap = {};
const ERROR_EMBED = new EmbedBuilder()
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
  let root = ERROR_EMBED;
  let sentMessage = null;
  let running = false;

  try {
    root = await getMessageForPage(page, message.author);
    // we are expecting the function to handle the faulty return.
    if (!root) return null;

    const buttons = [["reset", { disabled: true }], ["back"], ["forward"]];
    if (maxPages !== Infinity) buttons.push(["end"]);
    if (refresh) buttons.push(["refresh"]);
    const components = maxPages < 2 ? [] : [actionsToButtonRow(buttons)];
    sentMessage = botMessage
      ? await botMessage.edit({ embeds: [root], components })
      : await message.reply({ embeds: [root], components });
    if (maxPages < 2) {
      return sentMessage;
    }
    const componentCollector =
      sentMessage.channel.createMessageComponentCollector({
        filter: i => i.message.id === sentMessage.id,
        ...collectorOpts,
      });
    componentCollector.on("end", async () => {
      sentMessage.edit({ components: [] });
    });
    return componentCollector.on("collect", async i => {
      if (i.user.id !== message.author.id) {
        return i.deferUpdate({ ephemeral: true });
      }
      if (running) return;
      const { user } = i;
      let res;
      let newPage = 0;
      running = true;
      try {
        switch (i.customId) {
          case "refresh": {
            // NO OP
            break;
          }
          case "reset": {
            newPage = 0;
            break;
          }
          case "end": {
            newPage = maxPages - 1;
            break;
          }
          case "back": {
            if (page > 0) {
              newPage = page - 1;
            } else {
              if (maxPages !== Infinity) {
                newPage = maxPages - 1;
              }
            }
            break;
          }
          case "forward": {
            newPage = Math.min(page + 1, maxPages - 1);
            if (page === newPage && page === maxPages - 1) newPage = 0;
            break;
          }
        }
        res = await getMessageForPage(newPage, user);
      } catch (err) {
        console.error(err);
        sentMessage.edit({ embeds: [ERROR_EMBED] });
      }
      running = false;
      if (res) page = newPage;
      if (res) {
        const updatedButtons = [
          ["reset", { disabled: page === 0 }],
          ["back"],
          ["forward"],
        ];
        if (maxPages !== Infinity)
          updatedButtons.push(["end", { disabled: page === maxPages - 1 }]);
        if (refresh) updatedButtons.push(["refresh"]);
        return i.update({
          embeds: [res],
          components: [actionsToButtonRow(updatedButtons)],
        });
      }
      return null;
    });
  } catch (err) {
    console.error(err);
    if (sentMessage) sentMessage.edit({ embeds: [ERROR_EMBED] });
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
  let root = ERROR_EMBED;
  let inSubPage = false;
  let sentMessage = null;
  let running = false;

  try {
    root = await getMessageForPage(page, message.author, inSubPage, null);

    // we are expecting for the function to handle it.
    if (!root) return null;
    userMap[`${message.channel.id}:${message.author.id}`] = s;

    sentMessage = await message.reply({ embeds: [root] });

    const filter = m =>
      m.author.id == message.author.id && // it's sent by the user who requested the list
      s === userMap[`${message.channel.id}:${message.author.id}`] && // no other command is running with us
      command(m.content); // is a valid command

    return sentMessage.channel
      .createMessageCollector({ filter, ...collectorOpts })
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
        m.delete().catch(() => null);
      })
      .on("end", () => {
        if (s === userMap[`${message.channel.id}:${message.author.id}`])
          delete userMap[`${message.channel.id}:${message.author.id}`];
      });
  } catch (err) {
    console.error(err);
    if (sentMessage) sentMessage.edit({ embeds: [ERROR_EMBED] });
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
