const { Client } = require("discord.js");
const PgApi = require("./storage/database/Api");
const RedisApi = require("./storage/redis/Api");
const EventManager = require("./EventManager");

const { readDirectoryRecursiveWithFilter } = require("./utils/FsUtils");
class Instance {
  /**
   *
   * @param {*} config
   * @param {PgApi} database
   * @param {RedisApi} cache
   * @param {Client} client
   * @param {*} onReady
   */
  constructor(config, database, cache, client, onReady) {
    this.config = config;
    this.database = database;
    this.cache = cache;
    this.client = client;
    this.onReady = onReady;
    this.logChannels = {};
  }
  async prepareEvents() {
    const events = {};
    const entries = readDirectoryRecursiveWithFilter(
      this.config.structure.events,
      "src/",
      (name) => name.endsWith(".js")
    );
    for (const file of entries) {
      const event = require(`./${file}`);
      if (!event.eventName) throw new Error(`no event name specified! ${file}`);
      if (event.init) await event.init(this);
      if (!events[event.eventName]) events[event.eventName] = [];
      event.file = file;
      events[event.eventName].push(event);
    }
    return events;
  }
  async prepareCommands() {
    const commands = {};
    const entries = readDirectoryRecursiveWithFilter(
      this.config.structure.commands,
      "src/",
      (name) => name.endsWith(".js") && !name.endsWith("utils.js")
    );
    for (const file of entries) {
      const command = require(`./${file}`);
      if (commands[command.info.name]) {
        throw new Error(`Duplicated command ${command.info.name}`);
      }
      if (command.init) await command.init(this);
      command.file = file;

      commands[command.info.name] = command;
    }
    return commands;
  }
  async bootrap() {
    if (this.bootstrapped) return;
    const commands = await this.prepareCommands();
    const events = await this.prepareEvents();
    this.eventManager = new EventManager(this, events, commands);
    await this.eventManager.setup();
    this.bootstrapped = true;
    this.onReady();
  }
}
module.exports = Instance;
