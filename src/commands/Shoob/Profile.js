const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { getCachedURL } = require("../../utils/cacheUtils");
const { MessageEmbed, MessageAttachment } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { mention, userId } = require("../../utils/regexUtils");
const isDev = process.env.NODE_ENV === "development";
const { owner } = isDev
  ? require("../../config-dev.js")
  : require("../../config-prod.js");

const info = {
  name: "profile",
  aliases: ["rank", "p"],
  matchCase: false,
  category: "Shoob",
  perms: ["ATTACH_FILES"],
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
    let member =
      message.mentions.users.first() ||
      (args.length >= 1 &&
        userId.test(args[0]) &&
        (await instance.client.users.fetch(args[0]).catch(() => null)));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!member) {
      member = message.author;
    }

    message.channel.sendTyping().catch(() => null);

    const user = await Fetcher.fetchProfile(instance, member.id);
    const { rows: cards } = await instance.database.pool.query(
      "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE discord_id=$1 AND server_id=$2 AND SEASON=$3 GROUP BY tier",
      [member.id, instance.serverIds[message.guild.id], instance.config.season]
    );
    const {
      rows: [position],
    } = await instance.database.pool.query(
      "SELECT aggregates.* FROM (SELECT count(id) AS c, discord_id, ROW_NUMBER() OVER (ORDER BY count(id) DESC) as row FROM card_claims WHERE claimed=true AND server_id=$2 AND season=$3 GROUP BY discord_id ORDER BY c DESC) AS aggregates WHERE aggregates.discord_id=$1",
      [member.id, instance.serverIds[message.guild.id], instance.config.season]
    );

    const background1 = await loadImage("./src/assets/profile.png");
    const avatarB = await getCachedURL(
      instance,
      member.displayAvatarURL({ format: "png", size: 512 })
    );
    const avatar = await loadImage(avatarB);

    const canvas = createCanvas(1100, 400);
    const ctx = canvas.getContext("2d");
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
    for (const tier of tierPositions) {
      const claims = cards.find(t => t.tier === tier.t);
      const c = claims ? claims.c : "0";
      ctx.fillText(`${c}x`, tier.x, tier.y);
    }

    const color =
      (user &&
        ((owner.includes(member.id) && Color.trusted) ||
          (user.trusted && Color.cardmaker) ||
          (user.premium && Color.premium))) ||
      Color.default;

    const viewer = user ? user.last_viewer : null;

    let description =
      `<:Flame:783439293506519101> [Shoob.gg Profile](https://shoob.gg/user/${member.id})` +
      (viewer && viewer.discord_id !== ""
        ? `\n<:KiraraPeek:784849772272025600> ` +
          `Last viewed by [**__${viewer.username}__**](https://shoob.gg/user/${viewer.discord_id})`
        : "") +
      (owner.includes(member.id)
        ? `\n<:KiraraHugHeart:798460293491326986> **Kirara Developer <3**`
        : "") +
      (user && user.trusted
        ? `\n<:KiraraSleepy:784849773097517086> **Card Maker!**`
        : "");

    const attachment = new MessageAttachment(canvas.toBuffer(), "profile.png");
    const embed = new MessageEmbed()
      .setAuthor({
        name: `${member.username}'s profile`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor(color)
      .setURL(`https://shoob.gg/user/${member.id}`)
      .setDescription(description)
      .setImage("attachment://profile.png");

    if (user !== null) {
      embed
        .addField("Premium", user.premium ? "Yes" : "No", true)
        .addField("Votes", user.votes.toString(), true)
        .addField("Views", user.views.toString(), true);
    }

    return message.reply({ embeds: [embed], files: [attachment] });
  },
  info,
  help: {
    usage: "profile [@user]",
    examples: ["profile", "rank @JeDaYoshi"],
    description: "See your profile and your claim count!",
  },
};
