const { withCooldown } = require("./utils/hooks");
const sendError = require("./utils/SendError");
const sendUsage = require("./utils/SendUsage");
const isDev = process.env.NODE_ENV === "development";
const { owner } = isDev
  ? require("./config-dev.js")
  : require("./config-prod.js");

class EventManager {
  /**
   *
   * @param {Instance} instance
   * @param {*} events
   * @param {*} commands
   */
  constructor(instance, events, commands, services) {
    this.instance = instance;
    this.client = instance.client;
    this.config = instance.config;
    this.events = events;
    this.commands = commands;
    this.services = services;
    this.mentionRegex = null;
    this.commandQueue = [];
    this.discordReady = false;
  }
  registerOnMessage() {
    const otherHandlers = this.events["message"];
    this.client.on("message", async message => {
      if (!this.mentionRegex)
        this.mentionRegex = new RegExp(`^<@!?${this.client.user.id}> ?`);

      if (message.channel.type === "dm") return; // ToDo: Reimplement
      const prefix =
        (this.instance.guilds[message.guild.id] || {}).prefix ||
        this.config.prefix;
      const mentionMatch = this.mentionRegex.test(message.content);
      if (mentionMatch || message.content.toLowerCase().indexOf(prefix) === 0) {
        if (message.author.bot && message.author.id !== "736067018628792322")
          return;
        const plen = mentionMatch
          ? message.content.match(this.mentionRegex)[0].length
          : prefix.length;
        const args = message.content.slice(plen).trim().split(/ +/g);
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
          try {
            await handler.execute(this.instance, message);
          } catch (err) {
            // do not stop other handlers execution if any fail.
            console.error(err);
          }
        }
    });
  }
  registerOnReady() {
    this.client.on("ready", async t => {
      const otherHandlers = this.events["ready"];
      if (otherHandlers)
        for (const handler of otherHandlers) {
          await handler.execute(this.instance, t);
        }
      // start services after this
      this.services.forEach(element => {
        element.start(this.instance);
      });
      this.discordReady = true;
      // prcoess queued commands
      for (const elem of this.commandQueue) {
        await this.commandEXecution(elem[0], elem[1], elem[2]);
      }
      this.commandQueue = null;
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

    await withCooldown(
      this.instance.cache,
      message,
      command.info.name,
      async () => {
        try {
          const result = await command.execute(this.instance, message, args);
          if (result === false) sendUsage(message.channel, command.help);
          return result;
        } catch (err) {
          sendError(message.channel);
          console.error(err);
        }
      },
      command.info.cooldown || 0,
      true
    );
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
  registerEventHandler(name, handlers) {
    this.client.on(name, async param => {
      if (!this.discordReady) return;
      for (const handler of handlers) {
        try {
          await handler.execute(this.instance, param);
        } catch (err) {
          console.error(
            `handling failed for ${name}, file: ${handler.file}`,
            err
          );
        }
      }
    });
  }
  setup(reload = false) {
    Object.keys(this.events).forEach(elem => {
      if (elem === "message" || elem === "ready") return;
      this.registerEventHandler(elem, this.events[elem]);
    });
    this.registerOnMessage();
    if (!reload) this.registerOnReady();
    else this.services.forEach(element => element.start(this.instance));
  }
}
module.exports = EventManager;
