const { MessageEmbed, MessageAttachment } = require("discord.js");

const { createCanvas, loadImage } = require("canvas");
const info = {
  name: "profile",
  aliases: ["rank", "p"],
  matchCase: false,
  category: "Shoob",
};

const tierPositions = [
  { t: "1", x: 510, y: 290 },
  { t: "2", x: 735, y: 290 },
  { t: "3", x: 935, y: 290 },
  { t: "4", x: 510, y: 360 },
  { t: "5", x: 735, y: 360 },
  { t: "6", x: 935, y: 360 },
];

module.exports = {
  execute: async (instance, message, args) => {
    const member = message.mentions.users.first() || message.author;
    const {
      rows: cards,
    } = await instance.database.pool.query(
      "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE discord_id=$1 AND server_id=$2 GROUP BY tier",
      [member.id, instance.serverIds[message.guild.id]]
    );
    const {
      rows: [position],
    } = await instance.database.pool.query(
      "SELECT aggregates.* FROM (SELECT count(id) AS c, discord_id, ROW_NUMBER() OVER (ORDER BY count(id) DESC) as row FROM card_claims WHERE claimed=true AND server_id=$2 group by discord_id ORDER BY c desc) as aggregates WHERE aggregates.discord_id=$1",
      [member.id, instance.serverIds[message.guild.id]]
    );

    const background1 = await loadImage("./src/assets/profile.png");
    const background2 = await loadImage("./src/assets/profile_anim.gif");
    const avatar = await loadImage(
      member.displayAvatarURL({ format: "png" }) + "?size=2048"
    );

    const canvas = createCanvas(1100, 400);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(background2, 26, 6, 390, 390);
    ctx.drawImage(avatar, 26, 6, 390, 390);
    ctx.drawImage(background1, 0, 0, canvas.width, canvas.height);

    ctx.font = "60px Century Gothic";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`#${member.discriminator}`, 1060, 75);

    const name =
      member.username.length > 12
        ? member.username.substr(0, 12)
        : member.username;
    const total = (cards || []).reduce(
      (prev, curr) => parseInt(prev) + parseInt(curr.c),
      0
    );
    ctx.textAlign = "left";
    ctx.fillText(name, 440, 75);
    ctx.font = "45px Century Gothic";
    // Claims
    ctx.fillText(`${total}x`, 703, 210);
    // Rank
    ctx.fillText(`${(position || {}).row || "-"}`, 667, 155);

    // Fill in tier counts
    tierPositions.forEach((tier) => {
      const claims = cards.find((t) => t.tier === tier.t);
      const c = claims ? claims.c : "0";
      ctx.fillText(`${c}x`, tier.x, tier.y);
    });

    const attachment = new MessageAttachment(canvas.toBuffer(), "profile.png");
    const embed = new MessageEmbed()
      .setDescription(
        `<:shoob:760021745905696808> [Anime Soul Profile](https://animesoul.com/user/${member.id})`
      )
      .setColor("#17bcff")
      .setAuthor(
        `${member.username}'s Claims in ${message.guild.name}`,
        message.guild.iconURL()
      )
      .attachFiles([attachment])
      .setImage("attachment://profile.png");

    message.channel.send({ embed: embed });
  },
  info,
  help: {
    usage: "profile [@user]",
    examples: ["profile", "rank @JeDaYoshi"],
    description: "See your profile and your claim count!",
  },
};