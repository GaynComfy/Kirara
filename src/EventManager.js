const Instance = require("./Instance");
const { withCooldown } = require("./utils/hooks");
const sendUsage = require("./utils/SendUsage");

class EventManager {
  /**
   *
   * @param {Instance} instance
   * @param {*} events
   * @param {*} commands
   */
  constructor(instance, events, commands) {
    this.instance = instance;
    this.client = instance.client;
    this.config = instance.config;
    this.events = events;
    this.commands = commands;
  }
  registerOnMessage() {
    const otherHandlers = this.events["message"];
    this.client.on("message", async (message) => {
      if (message.channel.type === "dm") return;
      if (message.content.indexOf(this.config.prefix) === 0) {
        const args = message.content
          .slice(this.config.prefix.length)
          .trim()
          .split(/ +/g);
        const commandName = args.shift();
        const command = this.commands[commandName];
        if (command) {
          await withCooldown(
            this.instance.cache,
            message.author.id,
            command.info.name,
            async () => {
              const result = await command.execute(
                this.instance,
                message,
                args
              );
              if (result === false) sendUsage(message.channel, command.help);
              return result;
            },
            command.info.cooldown || 0,
            true
          );
        } else {
          //not yet found. this isnt the best time complexity but it should be still okay
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
                await withCooldown(
                  this.instance.cache,
                  message.author.id,
                  currentEntry.info.name,
                  async () => {
                    const result = await currentEntry.execute(
                      this.instance,
                      message,
                      args
                    );
                    if (result === false)
                      sendUsage(message.channel, command.help);

                    return result;
                  },
                  currentEntry.info.cooldown || 0,
                  true
                );
                break;
              }
            } else {
              if (
                Array.isArray(currentEntry.info.aliases) &&
                currentEntry.info.aliases.find((e) => e === commandName)
              ) {
                await withCooldown(
                  this.instance.cache,
                  message.author.id,
                  currentEntry.info.name,
                  async () => {
                    const result = await currentEntry.execute(
                      this.instance,
                      message,
                      args
                    );
                    if (result === false)
                      sendUsage(message.channel, command.help);
                    return result;
                  },
                  currentEntry.info.cooldown || 0,
                  true
                );
                break;
              }
            }
          }
        }
      }
      if (otherHandlers)
        for (const handler of otherHandlers) {
          await handler.execute(this.instance, message);
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
    });
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
  setup() {
    Object.keys(this.events).forEach((elem) => {
      if (elem === "message" || elem === "ready") return;
      this.registerEventHandler(elem, this.events[elem]);
    });
    this.registerOnMessage();
    this.registerOnReady();
  }
}
module.exports = EventManager;
