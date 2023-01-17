const { Collection } = require("discord.js");
/*
kirara-bot         | <@1064759396485300255>
kirara-bot         | <#1064798673038483499>
kirara-bot         | <@&1064798809621811284>
 */
module.exports = async (instance, interaction, command) => {
  const contentComponents = [];
  const message = {
    author: interaction.user,
    member: interaction.member,
    mentions: {
      users: new Collection(),
      channels: new Collection(),
      members: new Collection(),
    },
    interaction,
    id: interaction.id,
    delete: () => null,
    edit: () => null,
    reply: args => {
      interaction.didSendReply = true;
      const messageReply = typeof args === "string" ? { content: args } : args;
      messageReply.ephemeral = true;
      return interaction.reply(messageReply);
    },
  };

  for (const option of interaction.options.data) {
    if (option.type === 6) {
      // user
      contentComponents.push(`<@${option.value}>`);
      message.mentions.users.set(option.user.id, option.user);
      message.mentions.members.set(option.user.id, option.member);
    } else if (option.type === 3) {
      //string
      contentComponents.push(option.value);
    } else if (option.type === 10) {
      // number
      contentComponents.push(`${option.value}`);
    } else if (option.type === 7) {
      // channel
      contentComponents.push(`<#${option.value}>`);
      message.mentions.channels.set(option.channel.id, option.channel);
    } else if (option.type === 5) {
      // boolean
      const arg = command.arguments.find(arg => arg.name === option.name);
      const value = option.value ? arg.mapping[1] : arg.mapping[0];
      if (typeof value === "string") {
        contentComponents.push(value);
      }
    }
  }
  if (interaction.guildId) {
    message.guild = await instance.client.guilds.fetch(interaction.guildId);
    if (message.guild) {
      message.channel = await message.guild.channels.fetch(
        interaction.channelId
      );
    } else {
      return null;
    }
  } else {
    return null;
  }
  message.content = contentComponents.join(" ");
  return [message, contentComponents];
};
