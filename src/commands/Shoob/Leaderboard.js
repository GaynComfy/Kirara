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

const claimers = [
  {
    c: 225,
    discord_id: "77256980288253952",
  },
  {
    c: 220,
    discord_id: "399447856232005632",
  },
  {
    c: 219,
    discord_id: "304357538101723137",
  },
  {
    c: 121,
    discord_id: "195906408561115137",
  },
  {
    c: 121,
    discord_id: "195906408561115137",
  },
  {
    c: 121,
    discord_id: "195906408561115137",
  },
  {
    c: 121,
    discord_id: "195906408561115137",
  },
  {
    c: 121,
    discord_id: "195906408561115137",
  },
];
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
    const {
      rows: [server],
    } = await instance.database.simpleQuery("SERVERS", {
      id: instance.serverIds[message.guild.id],
    });
    const event = server.event;

    const { rows: claimers } = event
      ? await instance.database.pool.query(
          "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true AND server_id=$1 AND time > $2 GROUP BY discord_id ORDER BY c DESC LIMIT 10",
          [server.id, server.event_time]
        )
      : await instance.database.pool.query(
          "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true AND server_id=$1 GROUP BY discord_id ORDER BY c DESC LIMIT 10",
          [server.id]
        );

    const background = await loadImage("./src/assets/leaderboard.png");
    const icon = await loadImage(message.guild.iconURL({ format: "png" }));
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(icon, 360, 55, 58, 58);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";

    for (const entry of claimers) {
      const index = claimers.indexOf(entry);
      const first = index === 0;
      const user = await instance.client.users.fetch(entry.discord_id);
      const discriminator = user ? user.discriminator : "#0000";
      const name = user ? user.username : first ? "User Left" : "Some user";
      if (first) {
        const avatar = await loadImage(
          user
            ? user.displayAvatarURL({ format: "png" })
            : "https://cdn.discordapp.com/embed/avatars/0.png"
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
      ctx.fillStyle = first ? "#ffffff" : "#f49e17";
      ctx.textAlign = "left";
      ctx.fillText(name, 405, 176 + 53 * index);
      ctx.font = "24px Century Gothic";
      ctx.textAlign = "center";
      ctx.fillText(entry.c, 710, 176 + 53 * index);
    }
    const attachment = new MessageAttachment(
      canvas.toBuffer(),
      "leaderboard.png"
    );
    const hugEmbed = new MessageEmbed()
      .setColor("#f49e17")
      .setAuthor(message.guild.name + "'s Leaderboard", message.guild.iconURL())
      .attachFiles([attachment])
      .setImage("attachment://leaderboard.png");
    message.channel.send({ embed: hugEmbed });
    return true;
  },
  info,
  help: {
    usage: "lb",
    examples: ["lb", "leaderboard"],
    description: "Top claims on the server!",
  },
};
