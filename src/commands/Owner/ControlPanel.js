const { MessageEmbed } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const { getInfo } = require("./utils");
const color = require("../../utils/Colors.json");
const info = {
  name: "controlpanel",
  aliases: ["cp"],
  matchCase: false,
  category: "Owner",
};
const numberWithCommas = (entry) =>
  entry.toLocaleString(undefined, {
    style: "decimal",
    maximumFractionDigits: 0,
  });
const actions = [
  {
    emote: "🏠",
    handler: async (instance, embedMessage, originalMessage, embed, r) => {
      embed.setDescription(
        `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status \n\n 🏠 Control Panel Page \n 🔁 Reboot \n 💻 Status \n 🔀 Reload \n ❌ Close Panel **`
      );
      embed.setFooter(
        "Kirara Dev Panel",
        instance.client.user.displayAvatarURL({ type: "png" })
      );
      await embedMessage.edit(embed);

      return true;
    },
  },
  {
    emote: "❌",
    handler: async (instance, embedMessage, originalMessage, embed, r) => {
      await r.users.remove(
        r.users.cache.filter((u) => u === originalMessage.author).first()
      );
      await embedMessage.delete();
      return false;
    },
  },
  {
    emote: "🔀",
    handler: async (instance, embedMessage, originalMessage, embed, r) => {
      embed.setDescription(
        `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status**\n\n📁 **Reloading: \n❌ Commands\n❌ Handlers\n❌ Inhibitors**`
      );
      embed.setFooter(
        "Reloading...",
        r.client.user.displayAvatarURL({ type: "png" })
      );
      await embedMessage.edit(embed);

      await instance.initReload();

      setTimeout(function () {
        embed.setDescription(
          `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status**\n\n🕊️ **Reloaded: \n✔️ Commands\n✔️ Handlers\n✔️ Inhibitors**`
        );
        embed.setFooter(
          "Reloaded!",
          r.client.user.displayAvatarURL({ type: "png" })
        );
        embedMessage.edit(embed);
      }, 3000);
    },
  },
  {
    emote: "🔁",
    handler: async (instance, embedMessage, originalMessage, embed, r) => {
      embed.setDescription(
        `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status \n\nRebooting :red_circle: :yellow_circle: :green_circle:**`
      );
      embed.setFooter(
        "Rebooting in 5 Seconds",
        r.client.user.displayAvatarURL({ type: "png" })
      );
      await embedMessage.edit(embed);

      setTimeout(() => {
        instance.client.shard.respawnAll();
      }, 5000);
      return false;
    },
  },
  {
    emote: "💻",
    handler: async (
      instance,
      embedMessage,
      originalMessage,
      embed,
      r,
      ping
    ) => {
      const guilds = instance.client.guilds.cache.map(
        (guild) => guild.members.cache.size
      );
      const { upWeeks, upDays, upHours, upMinutes, cpu } = getInfo();
      const stats = [
        `\`\`\`diff\n
- Idol City Status -
> Guilds        :: ${numberWithCommas(instance.client.guilds.cache.size)}
> Users         :: ${numberWithCommas(guilds.reduce((a, b) => a + b, 0))}
> Playing       :: ${instance.client.voice.connections.size}
> Channels      :: ${instance.client.channels.cache.size}
> Uptime        :: ${upWeeks}W ${upDays}D ${upHours}H ${upMinutes}M

- Bot Information -
> Ping          :: ${ping} ms
> Cpu Usage     :: ${cpu}

- Framework Version -
> Discord.js    :: v12.5.0\`\`\``,
      ];
      embed.setDescription(stats);
      embed.setFooter(
        "My Status",
        r.client.user.displayAvatarURL({ type: "png" })
      );
      await embedMessage.edit(embed);
    },
  },
];
module.exports = {
  execute: async (instance, message, args) => {
    return withOwner(
      message.author.id,
      async () => {
        const ping = new Date().getTime() - message.createdTimestamp;
        const helpembed = new MessageEmbed()
          .setAuthor(
            "❯\u2000Control Panel",
            message.author.displayAvatarURL({ type: "png" })
          )
          .setDescription(
            `**${message.author.username}-sama Welcome to My Control Panel/Status \n\n 🏠 Control Panel Page \n 🔁 Reboot \n 💻 Status \n 🔀 Reload \n ❌ Close Panel **`
          )
          .setColor(color.white)
          .setFooter(
            "Kirara Dev Panel",
            instance.client.user.displayAvatarURL({ type: "png" })
          )
          .setThumbnail("https://i.imgur.com/0Ei73vS.gif");
        let state = null;
        const msg = await message.channel.send(helpembed);
        const listeners = [];
        for (const action of actions) {
          await msg.react(action.emote);
          const collector = msg.createReactionCollector(
            (reaction, user) => {
              return (
                reaction.emoji.name === action.emote &&
                user.id === message.author.id
              );
            },
            { max: 1 }
          );
          collector.on("collect", (reaction) => {
            if (state !== action.emote) {
              /* i hate my life for this but its the only working approach */
              action
                .handler(instance, msg, message, helpembed, reaction, ping)
                .then((res) => {
                  if (res === false) {
                    //make sure to not leave these dangling
                    listeners.forEach((entry) =>
                      entry.removeAllListeners("collect")
                    );
                  } else {
                    reaction.users.remove(
                      reaction.users.cache
                        .filter((u) => u === message.author)
                        .first()
                    );
                  }
                });
              state = action.emote;
            }
          });
          listeners.push(collector);
        }
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "cp",
    examples: ["cp"],
    description: "View Server Settings.",
  },
};
