const Color = require("./Colors.json");
const { EmbedBuilder } = require("discord.js");

module.exports = async (channel, info) => {
  const fields = [
    { name: "Description", value: info.description, inline: true },
    { name: "Usage", value: `\`${info.usage}\`` },
  ];

  if (info.examples) {
    fields.push({
      name: "Examples",
      value: `\`\`\`diff\n+ ${info.examples.join("\n+ ")}\`\`\``,
    });
  }

  const embed = new EmbedBuilder()
    .setDescription("<:Sirona_NoCross:762606114444935168> Wrong command usage!")
    .setColor(Color.red)
    .addFields(fields);

  channel.send({ embeds: [embed] }).catch(() => null);
};
