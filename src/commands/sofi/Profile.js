const {
  getProfile,
  getFollowers,
  getCardStats,
  URLS,
} = require("../../utils/SofiUtils");
const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");

const info = {
  name: "sprofile",
  matchCase: false,
  category: "Sofi",
  cooldown: 10,
};

module.exports = {
  execute: async (instance, message, args) => {
    const force = false;
    const target =
      message.mentions.users.first() ||
      (args.length &&
        (await instance.client.users.fetch(args[0]).catch(() => null))) ||
      message.author;
    const [profile, followers, cardStats] = await Promise.all([
      getProfile(instance, target.id, force),
      getFollowers(instance, target.id, force),
      getCardStats(instance, target.id, force),
    ]);
    const sorted = cardStats ? cardStats.sort((a, b) => b.value - a.value) : [];
    if (!profile) {
      const embed = new EmbedBuilder()
        .setDescription(
          "<:Sirona_NoCross:762606114444935168> No Profile found for this user!"
        )
        .setColor(Color.red);
      message.reply({ embeds: [embed] });
      return true;
    }
    const {
      pageProps: {
        user: {
          //  profile: userProfile,
          username,
          avatarURL,
          profileData,
          badgeRoles,
          premium,
        },
      },
    } = profile;
    const embed = new EmbedBuilder()
      .setTitle(`${username}'s Profile on Sofi`)
      .setThumbnail(avatarURL);
    if (sorted.length)
      embed.addFields(
        sorted
          .slice(0, 3)
          .map(e => ({ name: e.tooltip, value: `${e.value}%`, inline: true }))
      );

    const socials = [];
    if (profileData) {
      if (profileData.background) embed.setImage(profileData.background);
      for (const k in profileData.socialMedia) {
        const entry = URLS[k];
        if (!entry) continue;
        const [url, name] = entry;
        socials.push(`[${name}](${url + profileData.socialMedia[k]})`);
      }
    }
    embed.setDescription(`${
      profileData.about ? `**${profileData.about}**\n` : ""
    }
      ${
        badgeRoles && badgeRoles.length
          ? `\`\`\`${badgeRoles.map(e => e.name).join(", ")}\`\`\``
          : ""
      }
      ${socials.join("\n")}`);
    embed.setFooter({
      text: `Views: ${profileData.views} Followers: ${followers?.length || 0} ${
        premium ? "Premium User" : ""
      }`,
    });
    message.reply({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "sprofile <@user>",
    examples: ["sprofile @~Nota~"],
    description: "Prints information about a user on sofi",
  },
};
