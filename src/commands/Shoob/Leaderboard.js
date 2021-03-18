const Color = require("../../utils/Colors.json");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { MessageEmbed, MessageAttachment } = require("discord.js");
registerFont("./src/assets/CenturyGothic.ttf", { family: "Century Gothic" });
registerFont("./src/assets/AppleColorEmoji.ttf", { family: "Apple" });

const info = {
  name: "leaderboard",
  aliases: ["lb"],
  matchCase: false,
  category: "Shoob",
};

const applyText = (canvas, text) => {
  const ctx = canvas.getContext("2d");
  let fontSize = 30;
  do {
    ctx.font = `${(fontSize -= 3)}px Century Gothic`;
  } while (ctx.measureText(text).width > canvas.width - 700);
  return ctx.font;
};
module.exports = {
  execute: async (instance, message, args) => {
    const isTotal =
      args.length >= 1 &&
      (args[0].toLowerCase() === "total" ||
        args[0].toLowerCase() === "t" ||
        args[0].toLowerCase() === "a");
    if (isTotal) args.shift();

    message.channel.startTyping();

    const { rows: claimers } = isTotal
      ? await instance.database.pool.query(
          "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
            "AND server_id=$1 GROUP BY discord_id ORDER BY c DESC LIMIT 8",
          [instance.serverIds[message.guild.id]]
        )
      : await instance.database.pool.query(
          "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
            "AND server_id=$1 AND season=$2 GROUP BY discord_id ORDER BY c DESC LIMIT 8",
          [instance.serverIds[message.guild.id], instance.config.season]
        );

    if (claimers.length === 0) {
      message.channel.stopTyping();
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> This server has no claimed cards${
            isTotal ? "" : " this season"
          }.`
        )
        .setColor(Color.red);
      return await message.channel.send(embed);
    }

    const background = await loadImage("./src/assets/leaderboard2.png");
    const iconURL = message.guild.iconURL({ format: "png" });
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d");
    if (iconURL) {
      const icon = await loadImage(iconURL);
      ctx.drawImage(icon, 360, 55, 58, 58);
    }
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";

    for (const [i, entry] of claimers.entries()) {
      const first = i === 0;
      const user = await instance.client.users.fetch(entry.discord_id);
      const discriminator = user ? user.discriminator : "#0000";
      const name = user
        ? user.username
            .replace(/[\u0080-\uF8FF]/g, "")
            .trim()
            .substr(0, 14)
        : first
        ? "User Left"
        : "Some user";
      if (first) {
        const aid = parseInt((user && user.discriminator) || "0000") % 5;
        const avatar = await loadImage(
          user && user.avatar
            ? user.displayAvatarURL({ format: "png" })
            : `https://cdn.discordapp.com/embed/avatars/${aid}.png`
        );
        ctx.save();
        ctx.arc(179.5, 245.5, 79, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 100, 167, 158, 158);
        ctx.restore();
        ctx.font = "30px Century Gothic";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`#${discriminator}`, 172, 401);
        ctx.font = "60px Century Gothic";
        ctx.fillText(entry.c, 172, 471);
        ctx.font = applyText(canvas, name);
        ctx.fillText(name, 172, 363);
      }
      ctx.font = "30px Century Gothic";
      ctx.fillStyle = i < 3 ? "#ffffff" : "#d5417c";
      ctx.textAlign = "left";
      ctx.fillText(name, 405, 176 + 53 * i);
      ctx.font = "24px Century Gothic";
      ctx.textAlign = "center";
      ctx.fillText(entry.c, 710, 176 + 53 * i);
    }
    const attachment = new MessageAttachment(
      canvas.toBuffer(),
      "leaderboard.png"
    );
    const embed = new MessageEmbed()
      .setColor("#d5417c")
      .setAuthor(
        `${message.guild.name}'s ${isTotal ? "Total " : ""}Leaderboard`,
        message.guild.iconURL()
      )
      .attachFiles([attachment])
      .setImage("attachment://leaderboard.png");

    message.channel.stopTyping();
    message.channel.send({ embed });
    return true;
  },
  info,
  help: {
    usage: "lb [total]",
    examples: ["lb", "leaderboard total"],
    description: "Top claims on the server!",
  },
};
