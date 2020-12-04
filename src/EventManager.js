const Instance = require("./Instance");
const { withCooldown } = require("./utils/hooks");
const sendError = require("./utils/SendError");
const sendUsage = require("./utils/SendUsage");

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
  }
  registerOnMessage() {
    const otherHandlers = this.events["message"];
    this.client.on("message", async (message) => {
      if (message.channel.type === "dm") return; // ToDo: Reimplement
      if (message.content.toLowerCase().indexOf(this.config.prefix.toLowerCase()) === 0) {
        if (message.author.bot) return;
        const args = message.content
          .slice(this.config.prefix.length)
          .trim()
          .split(/ +/g);
        const commandName = args.shift();
        const command = this.commands[commandName];
        if (command) {
          this.commandExecution(currentEntry, command, message, args);
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
                    (e) => e.toLowerCase() === commandName.toLowerCase()
                  ))
              ) {
                this.commandExecution(currentEntry, command, message, args);
              }
            } else {
              if (
                Array.isArray(currentEntry.info.aliases) &&
                currentEntry.info.aliases.find((e) => e === commandName)
              ) {
                this.commandExecution(currentEntry, command, message, args);
              }
            }
          }
        }
      }
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
    this.client.on("ready", async (t) => {
      const otherHandlers = this.events["ready"];
      if (otherHandlers)
        for (const handler of otherHandlers) {
          await handler.execute(this.instance, t);
        }
      this.services.forEach((element) => {
        element.start(this.instance);
      });
    });
  }
  commandExecution(mod, command, message, args) {
    await withCooldown(
      this.instance.cache,
      message.author.id,
      mod.info.name,
      async () => {
        try {
          const result = await command.execute(
            this.instance,
            message,
            args
          );
          if (result === false) sendUsage(message.channel, command.help);
          return result;
        } catch (err) {
          sendError(message.channel);
          console.error(err);
        }
      },
      mod.info.cooldown || 0,
      true
    );
  }
  cleanup() {
    Object.keys(this.events)
      .filter((value, index, self) => self.indexOf(value) === index)
      .forEach((key) => this.client.removeAllListeners(key));
    for (const service of this.services) {
      service.stop(this.instance);
    }
    this.events = {};
    this.commands = {};
    this.services = [];
  }
  registerEventHandler(name, handlers) {
    this.client.on(name, async (param) => {
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
    Object.keys(this.events).forEach((elem) => {
      if (elem === "message" || elem === "ready") return;
      this.registerEventHandler(elem, this.events[elem]);
    });
    this.registerOnMessage();
    if (!reload) this.registerOnReady();
    else
      this.services.forEach((element) => {
        element.start(this.instance);
      });
  }
}
module.exports = EventManager;
