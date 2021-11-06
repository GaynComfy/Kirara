const { ShardingClient } = require("statcord.js");
const { withCooldown, verifyPerms } = require("./utils/hooks");
const sendError = require("./utils/SendError");
const sendUsage = require("./utils/SendUsage");
const { owner } =
  process.env.NODE_ENV === "development"
    ? require("./config-dev.js")
    : require("./config-prod.js");

const spaces = / +/g;

class EventManager {
  /**
   *
   * @param {require("./Instance").Instance} instance
   * @param {object[]} events
   * @param {object[]} commands
   * @param {object[]} services
   */
  constructor(instance, events, commands, services) {
    this.instance = instance;
    this.client = instance.client;
    this.config = instance.config;
    this.events = events;
    this.commands = commands;
    this.services = services;
    this.mentionRegex = new RegExp(`^<@!?748100524246564894> ?`);
    this.commandQueue = [];
    this.discordReady = false;
  }
  registerOnMessage() {
    const otherHandlers = this.events["message"];
    this.client.on("message", async message => {
      if (message.channel.type === "dm") return; // ToDo: Reimplement
      const prefix =
        (this.instance.guilds[message.guild.id] || {}).prefix ||
        this.config.prefix;
      const hasPrefix = message.content.toLowerCase().indexOf(prefix) === 0;
      const mentionMatch =
        !hasPrefix && this.mentionRegex.test(message.content);

      if (hasPrefix || mentionMatch) {
        if (message.author.bot && message.author.id !== "736067018628792322")
          return;
        const plen = mentionMatch
          ? message.content.match(this.mentionRegex)[0].length
          : prefix.length;
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
      this.services.forEach(element => element.start(this.instance));
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
    if (!this.instance.settings[message.guild.id]) return;
    if (command.info.guilds && !command.info.guilds.includes(message.guild.id))
      return; // return if not found

    if (
      (this.instance.settings[message.guild.id][
        `category:${command.info.category.toLowerCase()}:disabled`
      ] ||
        this.instance.settings[message.guild.id][
          `cmd:${command.info.name}:disabled`
        ]) &&
      !message.member.hasPermission("ADMINISTRATOR") &&
      !owner.includes(message.author.id)
    )
      return; // command is disabled and they're not an admin/owner, nothing to do here

    const startMs = Date.now();

    // verify if we have the right permissions
    const perms = [
      "SEND_MESSAGES",
      "EMBED_LINKS",
      "USE_EXTERNAL_EMOJIS",
    ].concat(command.info.perms || []);
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
            needsQueue ? this.instance.queues[message.channel.id] : null
          );
          if (result === false) sendUsage(message.channel, command.help);
          return result;
        } catch (err) {
          sendError(message.channel);
          const endMs = Date.now() - startMs;
          console.error(
            `[${this.client.shard.ids[0]}] <#${message.channel.id}> ${message.author.tag} > ${command.info.name} (${endMs}ms)`
          );
          console.error(err);
        }
      },
      command.info.cooldown || 0,
      true
    );

    const endMs = Date.now() - startMs;
    console.debug(
      `[${this.client.shard.ids[0]}] <#${message.channel.id}> ${message.author.tag} > ${command.info.name} (${endMs}ms)`
    );

    // statcord reports
    ShardingClient.postCommand(
      command.info.name,
      message.author.id,
      this.client
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
  cleanup() {
    Object.keys(this.events)
      .filter((value, index, self) => self.indexOf(value) === index)
      .forEach(key => this.client.removeAllListeners(key));
    for (const service of this.services) {
      service.stop(this.instance);
    }
    this.events = {};
    this.commands = {};
    this.services = [];
  }
  async setup(wasReady = false) {
    Object.keys(this.events).forEach(elem => {
      if (elem === "message" || elem === "ready") return;
      this.registerEventHandler(elem, this.events[elem]);
    });
    this.registerOnMessage();
    this.registerOnReady();
    if (wasReady) {
      const otherHandlers = this.events["ready"];
      if (otherHandlers) {
        for (const handler of otherHandlers) {
          await handler.execute(this.instance);
        }
      }
      this.services.forEach(element => element.start(this.instance));
    }
    this.discordReady = wasReady;
  }
}
module.exports = EventManager;
