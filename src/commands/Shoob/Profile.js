const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const isDev = process.env.NODE_ENV === "development";
const { owner } = isDev
  ? require("../../../config-dev.js")
  : require("../../../config-prod.js");

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
    message.channel.startTyping();
    const member = message.mentions.users.first() || message.author;
    const user = await Fetcher.fetchProfile(instance, member.id);
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

    const name = member.username.substr(0, 12);
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

    const color =
      (user &&
        ((user.card_game_senpai && Color.sensei) ||
          (user.trusted && Color.trusted) ||
          (user.premium && Color.premium))) ||
      Color.default;

    const viewer = user ? user.last_viewer : null;

    const attachment = new MessageAttachment(canvas.toBuffer(), "profile.png");
    const embed = new MessageEmbed()
      .setAuthor(`${member.username}'s profile`, message.guild.iconURL())
      .setColor(color)
      .setURL(`https://animesoul.com/user/${member.id}`)
      .setDescription(
        `<:Flame:783439293506519101> [Anime Soul Profile](https://animesoul.com/user/${member.id})` +
          (viewer
            ? `\n<:KiraraPeek:784849772272025600> ` +
              `Last viewed by [**__${viewer.username}__**](https://animesoul.com/user/${viewer.discord_id})`
            : "") +
          (user.card_game_senpai
            ? `\n<:KiraraFufu:784849773160431626> **Card Game Sensei**`
            : "") +
          (user.trusted
            ? `\n<:KiraraSleepy:784849773097517086> **Trusted!**`
            : "") +
          (owner.includes(member.id)
            ? `\n<:KiraraHugHeart:798460293491326986> **Kirara Developer <3**`
            : "")
      )
      .attachFiles([attachment])
      .setImage("attachment://profile.png");

    if (user) {
      embed
        .addField("Premium", user.premium ? "Yes" : "No", true)
        .addField("Votes", user.votes, true)
        .addField("Views", user.views, true);
    }

    message.channel.stopTyping();
    message.channel.send({ embed: embed });
  },
  info,
  help: {
    usage: "profile [@user]",
    examples: ["profile", "rank @JeDaYoshi"],
    description: "See your profile and your claim count!",
  },
};
