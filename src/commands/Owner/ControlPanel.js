const { MessageEmbed } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const { getInfo } = require("./utils");
const color = require("../../utils/Colors.json");
const info = {
  name: "controlpanel",
  aliases: ["cp"],
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
  disabled: true,
};
const numberWithCommas = entry =>
  entry.toLocaleString(undefined, {
    style: "decimal",
    maximumFractionDigits: 0,
  });
const actions = [
  {
    emote: "🏠",
    handler: async (instance, embedMessage, originalMessage, embed) => {
      embed.setDescription(
        `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status \n\n 🏠 Control Panel Page \n 🔁 Reboot \n 💻 Status \n 🔀 Reload \n ❌ Close Panel **`
      );
      embed.setFooter({
        text: "Kirara Dev Panel",
        iconURL: instance.client.user.displayAvatarURL({ type: "png" }),
      });
      await embedMessage.edit({ embeds: [embed] });

      return true;
    },
  },
  {
    emote: "❌",
    handler: async (instance, embedMessage, originalMessage, embed, r) => {
      await r.users.remove(
        r.users.cache.filter(u => u === originalMessage.author).first()
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
      embed.setFooter({
        text: "Reloading...",
        iconURL: r.client.user.displayAvatarURL({ type: "png" }),
      });
      await embedMessage.edit({ embeds: [embed] });

      await instance.initReload();

      setTimeout(function () {
        embed.setDescription(
          `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status**\n\n🕊️ **Reloaded: \n✔️ Commands\n✔️ Handlers\n✔️ Inhibitors**`
        );
        embed.setFooter({
          text: "Reloaded!",
          iconURL: r.client.user.displayAvatarURL({ type: "png" }),
        });
        embedMessage.edit({ embeds: [embed] });
      }, 3000);
    },
  },
  {
    emote: "🔁",
    handler: async (instance, embedMessage, originalMessage, embed, r) => {
      embed.setDescription(
        `**${originalMessage.author.username}-sama Welcome to My Control Panel/Status \n\nRebooting :red_circle: :yellow_circle: :green_circle:**`
      );
      embed.setFooter({
        text: "Rebooting in 5 Seconds",
        iconURL: r.client.user.displayAvatarURL({ type: "png" }),
      });
      await embedMessage.edit({ embeds: [embed] });

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
        guild => guild.members.cache.size
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
      embed.setFooter({
        text: "My Status",
        iconURL: r.client.user.displayAvatarURL({ type: "png" }),
      });
      await embedMessage.edit({ embeds: [embed] });
    },
  },
];
module.exports = {
  execute: async (instance, message) => {
    return withOwner(
      message.author.id,
      async () => {
        const ping = new Date().getTime() - message.createdTimestamp;
        const helpembed = new MessageEmbed()
          .setAuthor({
            name: "❯\u2000Control Panel",
            iconURL: message.author.displayAvatarURL({ type: "png" }),
          })
          .setDescription(
            `**${message.author.username}-sama Welcome to My Control Panel/Status \n\n 🏠 Control Panel Page \n 🔁 Reboot \n 💻 Status \n 🔀 Reload \n ❌ Close Panel **`
          )
          .setColor(color.white)
          .setFooter({
            text: "Kirara Dev Panel",
            iconURL: instance.client.user.displayAvatarURL({ type: "png" }),
          })
          .setThumbnail("https://i.imgur.com/0Ei73vS.gif");
        let state = null;
        const msg = await message.channel.send({ embeds: [helpembed] });
        const listeners = [];
        for (const action of actions) {
          await msg.react(action.emote);
          const filter = (reaction, user) => {
            return (
              reaction.emoji.name === action.emote &&
              user.id === message.author.id
            );
          };
          const collector = msg.createReactionCollector({ filter, max: 1 });
          collector.on("collect", reaction => {
            if (state !== action.emote) {
              /* i hate my life for this but its the only working approach */
              action
                .handler(instance, msg, message, helpembed, reaction, ping)
                .then(res => {
                  if (res === false) {
                    //make sure to not leave these dangling
                    listeners.forEach(entry =>
                      entry.removeAllListeners("collect")
                    );
                  } else {
                    reaction.users.remove(
                      reaction.users.cache
                        .filter(u => u === message.author)
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
