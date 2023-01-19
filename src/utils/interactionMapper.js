const { Collection } = require("discord.js");
/*
kirara-bot         | <@1064759396485300255>
kirara-bot         | <#1064798673038483499>
kirara-bot         | <@&1064798809621811284>
 */

class Message {
  constructor(interaction, ephemeral = false) {
    this.ephemeral = ephemeral;

    this.author = interaction.user;
    this.member = interaction.member;
    this.mentions = {
      users: new Collection(),
      channels: new Collection(),
      members: new Collection(),
      roles: new Collection(),
    };
    this.interaction = interaction;
    this.id = interaction.id;
  }
  async reply(args) {
    this.interaction.didSendReply = true;
    const messageReply = typeof args === "string" ? { content: args } : args;
    messageReply.ephemeral = this.ephemeral || false;
    await this.interaction.reply(messageReply);
    const r = await this.interaction.fetchReply();
    this.createReactionCollector = r.createReactionCollector.bind(r);
    return r;
  }
  _setGuild(g) {
    this.guild = g;
  }
  _setChannel(channel) {
    this.channel = channel;
    if (this.ephemeral) {
      this.channel.send = args => {
        return this.reply(args);
      };
    }
  }
  edit() {}
  delete() {}
}

module.exports = async (instance, interaction, command) => {
  const contentComponents = [];
  const message = new Message(interaction, command.info.ephemeral);
  console.log(message.author);
  for (const option of interaction.options.data) {
    const arg = command.arguments.find(
      arg => arg.name.toLowerCase() === option.name
    );
    if (option.type === 6) {
      // user
      contentComponents.push([`<@${option.value}>`, arg.prio]);
      message.mentions.users.set(option.user.id, option.user);
      message.mentions.members.set(option.user.id, option.member);
    } else if (option.type === 3) {
      //string
      contentComponents.push([option.value, arg.prio]);
    } else if (option.type === 10) {
      // number
      contentComponents.push([`${option.value}`, arg.prio]);
    } else if (option.type === 7) {
      // channel
      contentComponents.push([`<#${option.value}>`, arg.prio]);
      message.mentions.channels.set(option.channel.id, option.channel);
    } else if (option.type === 5) {
      // boolean
      const value = option.value ? arg.mapping[1] : arg.mapping[0];
      if (typeof value === "string") {
        // make sure that bools are prepended
        contentComponents.push(value);
      }
    } else if (option.type === 8) {
      // role
      contentComponents.push([`<@&${option.value}>`, arg.prio]);
      message.mentions.roles.set(option.value, option.role);
    }
  }
  if (interaction.guildId) {
    message._setGuild(await instance.client.guilds.fetch(interaction.guildId));
    if (message.guild) {
      message._setChannel(
        await message.guild.channels.fetch(interaction.channelId)
      );
    } else {
      return null;
    }
  } else {
    return null;
  }
  const sorted = contentComponents
    .sort((a, b) => {
      if (typeof a[1] === "number" && typeof b[1] === "number") {
        return a[1] - b[1];
      }
      if (typeof a[1] === "number") {
        return -1;
      } else if (typeof b[1] === "number") {
        return 1;
      }
      return 0;
    })
    .map(entry => entry[0]);
  message.content = sorted.join(" ");
  return [message, sorted];
};
