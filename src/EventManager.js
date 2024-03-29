// const { ChannelType } = require("discord.js");
const { withCooldown, verifyPerms } = require("./utils/hooks");
const Constants = require("./utils/Constants.json");
const sendError = require("./utils/SendError");
const sendUsage = require("./utils/SendUsage");
const { save: saveLastCommand } = require("./utils/ReRun.js");

const spaces = / +/g;

class EventManager {
  /**
   *
   * @param {require("./Instance").Instance} instance
   * @param {object[]} events
   * @param {object[]} commands
   * @param {object[]} services
   */
  constructor(instance, events, restEvents, commands, services) {
    this.instance = instance;
    this.client = instance.client;
    this.config = instance.config;
    this.events = events;
    this.restEvents = restEvents;
    this.commands = commands;
    this.services = services;
    this.mentionRegex = null;
    this.commandQueue = [];
    this.discordReady = false;
  }
  registerOnMessage() {
    const otherHandlers = this.events["messageCreate"];
    this.client.on("messageCreate", async message => {
      // if (message.channel.type === ChannelType.DM) return; // ToDo: Reimplement
      const prefix =
        (this.instance.guilds[message.guild.id] || {}).prefix ||
        this.config.prefix;
      const hasPrefix = message.content.toLowerCase().indexOf(prefix) === 0;
      const mentionMatch =
        !hasPrefix &&
        this.mentionRegex &&
        this.mentionRegex.test(message.content);

      if (hasPrefix || mentionMatch) {
        if (message.author.bot && message.author.id !== "736067018628792322")
          return;
        const match = mentionMatch
          ? message.content.match(this.mentionRegex)
          : false;
        const plen = match ? match.index + match[0].length : prefix.length;
        const args = message.content.substring(plen).trim().split(spaces);
        const commandName = args.shift();
        const command = this.commands[commandName];
        if (command) {
          this.commandExecution(command, message, args);
        } else {
          // not yet found. this isn't the best time complexity but it should be still okay
          for (const commandKey of Object.keys(this.commands)) {
            const currentEntry = this.commands[commandKey];
            if (!currentEntry.info.matchCase) {
              if (
                currentEntry.info.name.toLowerCase() ===
                  commandName.toLowerCase() ||
                (Array.isArray(currentEntry.info.aliases) &&
                  currentEntry.info.aliases.find(
                    e => e.toLowerCase() === commandName.toLowerCase()
                  ))
              ) {
                this.commandExecution(currentEntry, message, args);
              }
            } else {
              if (
                Array.isArray(currentEntry.info.aliases) &&
                currentEntry.info.aliases.find(e => e === commandName)
              ) {
                this.commandExecution(currentEntry, message, args);
              }
            }
          }
        }
      }
      if (!this.discordReady) return;
      if (otherHandlers)
        for (const handler of otherHandlers) {
          await handler
            .execute(this.instance, message)
            .catch(err => console.error(err));
        }
    });
  }
  reRun(commandName, target, args) {
    const command = this.commands[commandName];
    if (!command) {
      return false;
    }
    // This is to not save the same command into the cache again since we already have it.
    target._sirona_rerun = true;
    this.commandExecution(command, target, args);
    return true;
  }
  registerOnReady() {
    this.client.on("ready", async t => {
      this.mentionRegex = new RegExp(`^<@!?${this.client.user.id}> ?`);
      const otherHandlers = this.events["ready"];
      if (otherHandlers) {
        for (const handler of otherHandlers) {
          await handler.execute(this.instance, t);
        }
      }
      if (this.discordReady) return;
      // start services after this
      for (const service of this.services) {
        if (service.onlyOnDiscordStart) await service.start(this.instance);
        else service.start(this.instance);
      }
      this.discordReady = true;
      // process queued commands
      for (const elem of this.commandQueue) {
        await this.commandExecution(...elem).catch(err => console.error(err));
      }
      this.commandQueue = [];
    });
  }
  async commandExecution(command, message, args) {
    if (!this.discordReady) {
      this.commandQueue.push([command, message, args]);
      return;
    }
    const startMs = Date.now();

    if (!this.instance.settings[message.guild.id]) {
      console.error(
        `!! Just got a command from ${message.guild.id}, but I don't know what server it is!`
      );
      return message.channel
        .send(
          "**⚠️ WARNING:** I don't know this server. This is an error on the bot.\n" +
            "Mind helping me by reporting this to my dev team?\n\n" +
            "> Join Gay & Comfy: <https://discord.gg/comfy>\n" +
            "> Then, DM `DreiMail#4085` (<@!433253290898096139>) explaining the situation. Thank you!"
        )
        .catch(() => null);
    }
    if (command.info.guilds && !command.info.guilds.includes(message.guild.id))
      return; // return if we're not supposed to be used here
    const isSoftDisabled =
      this.instance.settings[message.guild.id][
        `category:${command.info.category.toLowerCase()}:disabled`
      ] ||
      this.instance.settings[message.guild.id][
        `cmd:${command.info.name}:disabled`
      ];
    if (isSoftDisabled) {
      if (
        !message.member.permissions.has("Administrator") &&
        !this.config.owner.includes(message.author.id)
      ) {
        // no perms at all, go away
        return;
      }
      // otherwise, give them an indicator they're using a disabled command
      message.react(Constants.disabledCmdReact).catch(() => null);
    }

    // verify if we have the right permissions
    const perms = ["SendMessages", "EmbedLinks", "UseExternalEmojis"].concat(
      command.info.perms || []
    );
    if (!(await verifyPerms(this.instance, message, perms))) return;

    await withCooldown(
      this.instance.cache,
      message,
      command.info.name,
      async () => {
        const { needsQueue } = command.info;
        if (needsQueue && !this.instance.queues[message.channel.id])
          this.instance.createQueue(message.channel.id);
        try {
          const result = await command.execute(
            this.instance,
            message,
            args,
            needsQueue ? this.instance.queues[message.channel.id] : undefined
          );
          if (typeof result !== "boolean")
            console.error(
              "Command did not return bool resultt",
              command.info.name,
              args
            );
          if (result === false) sendUsage(message.channel, command.help);
          if (result && !message._sirona_rerun)
            saveLastCommand(this.instance, command, message, args);

          return result;
        } catch (err) {
          console.error(
            `[${this.client.shard.ids[0]}] <#${message.channel.id}> ${message.author.tag} > ${command.info.name}`
          );
          console.error(err);
          sendError(message.channel);
        }
      },
      command.info.cooldown || 0,
      true
    );

    const endMs = Date.now();
    console.debug(
      `[${this.client.shard.ids[0]}] <#${message.channel.id}> ${message.author.tag} > ${command.info.name} ` +
        `(${endMs - startMs}ms/${endMs - message.createdTimestamp}ms` +
        `/${startMs - message.createdTimestamp}ms)`
    );
  }
  registerEventHandler(name, handlers) {
    this.client.on(name, async (...params) => {
      if (!this.discordReady) return;
      for (const handler of handlers) {
        try {
          await handler.execute(this.instance, ...params);
        } catch (err) {
          console.error(
            `handling failed for ${name}, file: ${handler.file}`,
            err
          );
        }
      }
    });
  }
  registerRestEventHandler(name, handlers) {
    this.client.rest.on(name, async (...params) => {
      for (const handler of handlers) {
        try {
          await handler.execute(this.instance, ...params);
        } catch (err) {
          console.error(
            `handling failed for ${name}, file: ${handler.file}`,
            err
          );
        }
      }
    });
  }
  cleanup() {
    Object.keys(this.events)
      .filter((value, index, self) => self.indexOf(value) === index)
      .forEach(key => this.client.removeAllListeners(key));
    Object.keys(this.restEvents)
      .filter((value, index, self) => self.indexOf(value) === index)
      .forEach(key => this.client.rest.removeAllListeners(key));
    for (const service of this.services) {
      service.stop(this.instance);
    }
    this.events = {};
    this.restEvents = {};
    this.commands = {};
    this.services = [];
  }
  async setup(wasReady = false) {
    Object.keys(this.events).forEach(elem => {
      if (elem === "messageCreate" || elem === "ready") return;
      this.registerEventHandler(elem, this.events[elem]);
    });
    Object.keys(this.restEvents).forEach(elem =>
      this.registerRestEventHandler(elem, this.restEvents[elem])
    );
    this.registerOnMessage();
    this.registerOnReady();
    if (wasReady) {
      this.services
        .filter(element => element.onlyOnDiscordStart !== true)
        .forEach(element => element.start(this.instance));
    }
    this.discordReady = wasReady;
  }
}
module.exports = EventManager;
