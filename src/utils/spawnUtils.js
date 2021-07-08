const { MessageEmbed } = require("discord.js");

exports.getTimer = (since, now = new Date()) => {
  // not even going to waste time looking
  const passed = now - since;
  if (passed >= 20000) return false;
  const secs = Math.max(Math.round(15 - passed / 1000), 0);

  let emote = "🟢";
  let color = "#16c60c";
  if (passed > 10500) {
    emote = "🔴";
    color = "#e81224";
  } else if (passed > 7000) {
    emote = "🟡";
    color = "#fff100";
  }
  let text = `${emote} | **Time remaining for spawn** \`${secs}\``;

  if (passed > 15000) {
    text = "<:SShoob:783636544720207903> | **Looks like nobody got the card!**";
    color = "#000000";
  }

  return new MessageEmbed().setColor(color).setDescription(text);
};
