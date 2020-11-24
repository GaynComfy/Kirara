const Instance = require("./Instance");

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
      if (message.content.indexOf(this.config.prefix) === 0) {
        const args = message.content
          .slice(this.config.prefix.length)
          .trim()
          .split(/ +/g);
        const commandName = args.shift();
        const command = this.commands[commandName];
        if (command) {
          await command.execute(this.instance, message, args);
        } else {
          //not yet found. this isnt the best time complexity but it should be still okay
          for (const currentEntry of commands) {
            if (!currentEntry.info.matchCase) {
              if (
                currentEntry.info.name.toLowerCase() ===
                  commandName.toLowerCase() ||
                (Array.isArray(currentEntry.info.aliases) &&
                  currentEntry.info.aliases.find(
                    (e) => e.toLowerCase() === commandName.toLowerCase()
                  ))
              ) {
                await currentEntry.execute(this.instance, message, args);
                break;
              }
            } else {
              if (
                Array.isArray(currentEntry.info.aliases) &&
                currentEntry.info.aliases.find((e) => e === commandName)
              ) {
                await currentEntry.execute(this.instance, message, args);
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
