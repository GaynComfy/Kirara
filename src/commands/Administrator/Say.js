const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");

const info = {
  name: "say",
  matchCase: false,
  category: "Administration",
  permissions: [PermissionsBitField.Flags.Administrator],
};
module.exports = {
  execute: async (instance, message, args) => {
    let msg;
    let textChannel = message.mentions.channels.first();
    if (
      !message.member.permissions.has([PermissionsBitField.Flags.Administrator])
    ) {
      const embed = new EmbedBuilder()
        .setDescription(
          "<:Sirona_NoCross:762606114444935168> Insufficient Permissions."
        )
        .setColor(Color.red);
      await message.channel.send({ embeds: [embed] });
    } else {
      if (!args[0]) {
        return false;
      } else if (textChannel) {
        msg = args.slice(1).join(" ");
        await textChannel.send(msg);
      } else {
        msg = args.join(" ");
        await message.channel.send(msg);
      }
    }
  },
  info,
  help: {
    usage: "say [text]",
    examples: ["say boshi smells"],
    description: "Say something using Kirara",
  },
};
