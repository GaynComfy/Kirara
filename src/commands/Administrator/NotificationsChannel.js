const { checkPerms, withRights } = require("../../utils/hooks");
const Color = require("../../utils/Colors.json");
const { EmbedBuilder } = require("discord.js");

const auc = ["auctions", "auc"];
const games = ["games", "minigames", "mg"];

const info = {
  name: "notifs",
  aliases: ["notifications", "notif"],
  matchCase: false,
  category: "Administration",
};

const exec = async (instance, message, args, type) => {
  const embed = new EmbedBuilder().setColor("Random");

  const {
    rows: [result],
  } = await instance.database.simpleQuery("SETTINGS", {
    key: `${type}_channel`,
    guild_id: message.guild.id,
  });
  const {
    rows: [autodel],
  } = await instance.database.simpleQuery("SETTINGS", {
    key: `${type}_autodelete`,
    guild_id: message.guild.id,
  });

  if (args.length >= 1 && args[0] === "off") {
    if (!result) {
      embed.setDescription("No notification channel set anyway!");
      return embed;
    }
    await instance.database.simpleDelete("SETTINGS", {
      id: result.id,
    });
    delete instance.settings[message.guild.id][`${type}_channel`];
    if (autodel) {
      await instance.database.simpleDelete("SETTINGS", {
        id: autodel.id,
      });
      delete instance.settings[message.guild.id][`${type}_autodelete`];
    }
    embed.setDescription(
      `<a:Sirona_Tick:749202570341384202> Notification channel removed!`
    );
    return embed;
  }
  if (args.length >= 2 && args[1] === "off") {
    if (!autodel) {
      embed.setDescription("No notification auto-delete timer set anyway!");
      return embed;
    }
    await instance.database.simpleDelete("SETTINGS", {
      id: autodel.id,
    });
    delete instance.settings[message.guild.id][`${type}_autodelete`];
    embed.setDescription(
      `<a:Sirona_Tick:749202570341384202> Notification auto-delete timer removed!`
    );
    return embed;
  }
  if (args.length >= 2 && isNaN(args[1])) return null;
  if (message.mentions.channels.size === 1) {
    const chn = message.mentions.channels.first();
    if (
      (await checkPerms(instance, chn, ["SendMessages", "EmbedLinks"])).length >
      0
    ) {
      embed
        .setColor(Color.red)
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> I don't have permission to send messages to <#${chn.id}>.`
        );
    }
    if (result) {
      await instance.database.simpleUpdate(
        "SETTINGS",
        {
          id: result.id,
        },
        {
          value: chn.id,
        }
      );
      instance.settings[message.guild.id][`${type}_channel`] = chn.id;
      if (autodel && args.length >= 2 && args[1] !== "off" && args[1] !== "0") {
        await instance.database.simpleUpdate(
          "SETTINGS",
          {
            id: autodel.id,
          },
          {
            value: args[1],
          }
        );
        instance.settings[message.guild.id][`${type}_autodelete`] = args[1];
      }
    } else {
      await instance.database.simpleInsert("SETTINGS", {
        key: `${type}_channel`,
        guild_id: message.guild.id,
        server_id: instance.serverIds[message.guild.id],
        value: chn.id,
      });
      instance.settings[message.guild.id][`${type}_channel`] = chn.id;
      if (args.length >= 2 && args[1] !== "off" && args[1] !== "0") {
        await instance.database.simpleInsert("SETTINGS", {
          key: `${type}_autodelete`,
          guild_id: message.guild.id,
          server_id: instance.serverIds[message.guild.id],
          value: args[1],
        });
        instance.settings[message.guild.id][`${type}_autodelete`] = args[1];
      }
    }
    embed.setDescription(
      `<a:Sirona_Tick:749202570341384202> Notifications channel set to <#${chn.id}>!` +
        (args.length >= 2 && args[1] !== "off" && args[1] !== "0"
          ? `\n⏲️ Messages will be auto-deleted after ${args[1]} ${
              parseInt(args[1]) > 1 ? "minutes" : "minute"
            }.`
          : "")
    );
  }
  return embed;
};

const execute = async (instance, message, args) => {
  return withRights(message.member, async () => {
    if (args.length <= 1) return false;
    let type = args[0].toLowerCase();
    args.shift();

    if (auc.includes(type)) {
      type = "notif";
    } else if (games.includes(type)) {
      type = "games";
    } else if (type === "all") {
      const em = await exec(instance, message, args, "notifs", true);
      if (em === null) return false;
      message.channel.send({ embeds: [em] });
      return exec(instance, message, args, "games", false);
    } else return false;
    const embed = await exec(instance, message, args, type);
    if (embed === null) return false;
    return message.channel.send({ embeds: [embed] });
  });
};

module.exports = {
  execute,
  info,
  help: {
    usage:
      "notifs <auctions/minigames> <#channel/off> [autodelete in mins/off]",
    examples: [
      "notifs auc #asn-auctions",
      "notifs games #asn-network-chet 5",
      "notifs mg #asn-network-chet off",
      "notifs all off",
    ],
    description:
      "Set up notifications for AS Auctions, Minigames and the likes!",
  },
};
