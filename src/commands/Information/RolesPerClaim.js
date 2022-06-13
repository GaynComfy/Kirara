const { MessageEmbed } = require("discord.js");

const info = {
  name: "rolesperclaim",
  aliases: ["roles", "rpc"],
  matchCase: false,
  category: "Information",
};

module.exports = {
  execute: async (instance, message) => {
    const embed = new MessageEmbed()
      .setColor("#e0e0e0")
      .setTitle("Shoob Roles");

    const { rows: roles } = await instance.database.pool.query(
      "SELECT * FROM claim_roles WHERE server_id = $1 ORDER BY -claims",
      [instance.serverIds[message.guild.id]]
    );

    if (!roles.length) {
      embed.setDescription(
        "\n\nThere are no claim roles setup in this server."
      );
    } else {
      for (const [i, role] of roles.entries()) {
        embed.addField(
          `#${i + 1} - ${role.claims} Cards`,
          `<@&${role.role_id}>`,
          true
        );
      }
    }

    return message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "rolesperclaim",
    examples: ["rolesperclaim"],
    description: "Show all of the server's roles for claims",
  },
};
