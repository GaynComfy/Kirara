const { MessageEmbed } = require("discord.js");

exports.getTimer = (since, now = Date.now()) => {
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
    text = "<a:Sirona_loading:748854549703426118> Please wait...";
    color = "RANDOM";
  }

  return new MessageEmbed().setColor(color).setDescription(text);
};
