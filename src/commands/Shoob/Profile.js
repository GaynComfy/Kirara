const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const sanitizer = require("@aero/sanitizer");
const { getCachedURL } = require("../../utils/cacheUtils");
const { EmbedBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { promisify } = require("util");
const { mention, userId } = require("../../utils/regexUtils");

const info = {
  name: "profile",
  aliases: ["rank", "p"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  perms: ["AttachFiles"],
};

const tierPositions = [
  { t: "1", x: 510, y: 290 },
  { t: "2", x: 735, y: 290 },
  { t: "3", x: 935, y: 290 },
  { t: "4", x: 510, y: 360 },
  { t: "5", x: 735, y: 360 },
  { t: "6", x: 935, y: 360 },
];
let DEFAULT_BACKGROUND;

module.exports = {
  init: async () => {
    DEFAULT_BACKGROUND = await loadImage("./src/assets/profile.png");
  },
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

    const [user, avatarB, cards, position] = await Promise.all([
      Fetcher.fetchProfile(instance, member.id),
      getCachedURL(
        instance,
        member.displayAvatarURL({
          extension: "png",
          size: 512,
          forceStatic: true,
        })
      ),
      instance.database.pool
        .query(
          "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE discord_id=$1 AND server_id=$2 AND SEASON=$3 GROUP BY tier",
          [
            member.id,
            instance.serverIds[message.guild.id],
            instance.config.season,
          ]
        )
        .then(r => r.rows),
      instance.database.pool
        .query(
          "SELECT aggregates.* FROM (SELECT count(id) AS c, discord_id, ROW_NUMBER() OVER (ORDER BY count(id) DESC) AS row FROM card_claims WHERE claimed=true AND server_id=$2 AND season=$3 GROUP BY discord_id ORDER BY c DESC) AS aggregates WHERE aggregates.discord_id=$1",
          [
            member.id,
            instance.serverIds[message.guild.id],
            instance.config.season,
          ]
        )
        .then(r => r.rows),
    ]);

    const avatar = await loadImage(avatarB);

    const canvas = createCanvas(1100, 400);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(avatar, 26, 6, 390, 390);
    ctx.drawImage(DEFAULT_BACKGROUND, 0, 0, canvas.width, canvas.height);

    ctx.font = "58px Century Gothic";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`#${member.discriminator}`, 1060, 75);

    const name = sanitizer(member.username.trim()).substring(0, 13);
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
        ((instance.config.owner.includes(member.id) && Color.trusted) ||
          (user.trusted && Color.cardmaker) ||
          (user.premium && Color.premium))) ||
      Color.default;

    const viewer = user ? user.last_viewer : null;

    const description =
      `<:Shoob:910973650042236938> [Shoob.gg Profile](https://shoob.gg/user/${member.id})` +
      (viewer && viewer.discord_id !== ""
        ? `\n<:KiraraPeek:784849772272025600> ` +
          `Last viewed by [**__${viewer.username}__**](https://shoob.gg/user/${viewer.discord_id})`
        : "") +
      (instance.config.owner.includes(member.id)
        ? `\n<:KiraraHugHeart:798460293491326986> **Kirara Developer <3**`
        : "") +
      (user && user.trusted
        ? `\n<:KiraraSleepy:784849773097517086> **Card Maker!**`
        : "");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${member.username}'s profile`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor(color)
      .setURL(`https://shoob.gg/user/${member.id}`)
      .setDescription(description)
      .setImage("attachment://profile.png");

    if (user) {
      embed.addFields([
        { name: "Premium", value: user.premium ? "Yes" : "No", inline: true },
        { name: "Votes", value: user.votes.toString(), inline: true },
        { name: "Views", value: user.views.toString(), inline: true },
      ]);
    }

    const toBuffer = promisify(canvas.toBuffer.bind(canvas));
    await message.reply({
      embeds: [embed],
      files: [
        {
          attachment: await toBuffer(),
          name: "profile.png",
        },
      ],
    });
    return true;
  },
  info,
  help: {
    usage: "profile [@user]",
    examples: ["profile", "rank @JeDaYoshi"],
    description: "See your profile and your claim count!",
  },
};
