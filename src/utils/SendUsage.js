const Color = require("./Colors.json");
const { MessageEmbed } = require("discord.js");
module.exports = async (channel, info) => {
  const embed = new MessageEmbed()
    .setDescription("<:Sirona_NoCross:762606114444935168> Wrong command usage!")
    .setColor(Color.red)
    .addField("Description", info.description, true)
    .addField("Usage", `\`${info.usage}\``);
  if (info.examples) {
    embed.addField(
      "Examples",
      `\`\`\`diff\n+ ${info.examples.join("\n+ ")}\`\`\``
    );
  }
  channel.send(embed);
};
