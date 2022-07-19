const Color = require("../../utils/Colors.json");
const sanitizer = require("@aero/sanitizer");
const { getCachedURL } = require("../../utils/cacheUtils");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { EmbedBuilder } = require("discord.js");
registerFont("./src/assets/CenturyGothic.ttf", { family: "Century Gothic" });
registerFont("./src/assets/AppleColorEmoji.ttf", { family: "Apple" });

const info = {
  name: "leaderboard",
  aliases: ["lb"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  perms: ["AttachFiles"],
};
let background;

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

    message.channel.sendTyping().catch(() => null);

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
      const embed = new EmbedBuilder()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> This server has no claimed cards${
            isTotal ? "" : " this season"
          }.`
        )
        .setColor(Color.red);
      return message.channel.send({ embeds: [embed] });
    }

    if (!background) {
      background = await loadImage("./src/assets/leaderboard2.png");
    }
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d");

    for (const [i, entry] of claimers.entries()) {
      const first = i === 0;
      let name = "Some user";
      let discriminator = "#0000";
      const user = await instance.client.users.fetch(entry.discord_id);
      if (user) {
        name = sanitizer(user.username.trim()).substring(0, 14);
        discriminator = user.discriminator;
      }
      if (first) {
        const promises = [];
        if (message.guild.icon) {
          promises.push(
            getCachedURL(
              instance,
              message.guild.iconURL({
                extension: "png",
                size: 64,
                forceStatic: true,
              })
            )
          );
        } else {
          promises.push(false);
        }
        if (user && user.avatar) {
          promises.push(
            getCachedURL(
              instance,
              user.displayAvatarURL({
                extension: "png",
                size: 256,
                forceStatic: true,
              })
            )
          );
        } else {
          const aid = (parseInt(user.discriminator.replace("#", "")) || 0) % 5;
          promises.push(`./src/assets/default/${aid}.png`);
        }

        const [guildIcon, userAvatar] = await Promise.all(promises);
        if (guildIcon) {
          const icon = await loadImage(guildIcon);
          ctx.drawImage(icon, 366, 56, 53, 53);
        }
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center";
        const avatar = await loadImage(userAvatar);
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
    const embed = new EmbedBuilder()
      .setColor("#d5417c")
      .setAuthor({
        name: `${message.guild.name}'s ${isTotal ? "Total " : ""}Leaderboard`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setImage("attachment://leaderboard.png");

    message.channel.send({
      embeds: [embed],
      files: [
        {
          attachment: canvas.toBuffer(),
          name: "leaderboard.png",
        },
      ],
    });
    return true;
  },
  info,
  help: {
    usage: "lb [total]",
    examples: ["lb", "leaderboard total"],
    description: "Top claims on the server!",
  },
};
