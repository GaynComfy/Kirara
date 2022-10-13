const { EmbedBuilder } = require("discord.js");

exports.getTimer = (since, now = Date.now()) => {
  // not even going to waste time looking
  const passed = now - since;
  if (passed >= 25000) return false;
  const secs = Math.max(Math.round(20 - passed / 1000), 0);

  let emote = "🟢";
  let color = "#16c60c";
  if (passed > 15000) {
    emote = "🔴";
    color = "#e81224";
  } else if (passed > 8000) {
    emote = "🟡";
    color = "#fff100";
  }
  let text = `${emote} | **Time remaining for spawn** \`${secs}\``;

  if (passed >= 20000) {
    text = "<a:Sirona_loading:748854549703426118> Please wait...";
    color = "Random";
  } else if (passed >= 23500) {
    text =
      "<a:Sirona_loading:748854549703426118> Probably nothing at this point...";
    color = "Random";
  }

  return new EmbedBuilder().setColor(color).setDescription(text);
};
