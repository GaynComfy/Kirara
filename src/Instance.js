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
    client.b_instance = this;
    this.onReady = onReady;
    this.serverIds = {};
    this.settings = {};
    this.guilds = {};
    this.shared = {};
    this.hasInit = false;
  }
  async prepareEvents() {
    const events = {};
    const entries = readDirectoryRecursiveWithFilter(
      this.config.structure.events,
      "src/",
      name => name.endsWith(".js")
    );
    for (const file of entries) {
      const event = require(`./${file}`);
      if (!event.eventName) throw new Error(`no event name specified! ${file}`);
      if (event.init) await event.init(this);
      if (!events[event.eventName]) events[event.eventName] = [];
      event.file = file;
      console.log(
        "adding event",
        file,
        event.eventName,
        this.client.shard.ids[0]
      );
      events[event.eventName].push(event);
    }
    return events;
  }
  async prepareServices() {
    const services = [];
    const entries = readDirectoryRecursiveWithFilter(
      this.config.structure.services,
      "src/",
      name => name.endsWith(".js")
    );
    for (const file of entries) {
      const event = require(`./${file}`);
      if (!event.stop || !event.start)
        throw new Error(`Services need a start/stop export to work ${file}`);
      if (event.init) await event.init(this);
      console.log("adding service", file, this.client.shard.ids[0]);
      services.push(event);
    }
    return services;
  }
  async prepareCommands() {
    const commands = {};
    const entries = readDirectoryRecursiveWithFilter(
      this.config.structure.commands,
      "src/",
      name => name.endsWith(".js") && !name.endsWith("utils.js")
    );
    for (const file of entries) {
      const command = require(`./${file}`);
      if (commands[command.info.name]) {
        throw new Error(`Duplicated command ${command.info.name}`);
      }
      if (command.info.disabled) continue;
      if (command.init) await command.init(this);
      command.file = file;
      console.log(
        "adding command",
        file,
        command.info.name,
        this.client.shard.ids[0]
      );
      commands[command.info.name] = command;
    }
    return commands;
  }
  async initReload() {
    this.client.shard.broadcastEval(`this.b_instance.reload()`);
  }
  async reload() {
    if (!this.bootstrapped) return;
    console.log("invoked reload", this.client.shard.ids);
    this.eventManager.cleanup();
    this.eventManager = null;
    const commands = await this.prepareCommands();
    const events = await this.prepareEvents();
    const services = await this.prepareServices();

    this.eventManager = new EventManager(this, events, commands, services);
    await this.eventManager.setup(true);
    this.bootstrapped = true;
  }
  async bootrap() {
    if (this.bootstrapped) return;
    const commands = await this.prepareCommands();
    const events = await this.prepareEvents();
    const services = await this.prepareServices();
    this.eventManager = new EventManager(this, events, commands, services);
    await this.eventManager.setup();
    this.bootstrapped = true;
    this.onReady();
  }
}
module.exports = Instance;
