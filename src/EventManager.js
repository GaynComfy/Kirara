// const { ChannelType } = require("discord.js");
const { ShardingClient } = require("statcord.js");
const { withCooldown, verifyPerms } = require("./utils/hooks");
const sendError = require("./utils/SendError");
const sendUsage = require("./utils/SendUsage");
const { owner } =
  process.env.NODE_ENV === "development"
    ? require("./config-dev.js")
    : require("./config-prod.js");

const spaces = / +/g;

const marriage = ["marriage", "marry", "divorce"];
const disallowedTabi = ["850218927136571392", "873835108069679124"];

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
    this.mentionRegex = new RegExp(`^<@!?748100524246564894> ?`);
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
    const startMs = Date.now();

    if (!this.instance.settings[message.guild.id]) {
      console.error(
        `!! Just got a command from ${message.guild.id}, but I don't know what server it is!`
      );
      return message.channel
        .send(
          "**⚠️ WARNING:** I don't know this server. This is an error on the bot.\n" +
            "Mind helping me to report it to my dev team? (<https://discord.gg/comfy> and DM `Sirona-Kirara Support#8123`)"
        )
        .catch(() => null);
    }
    if (command.info.guilds && !command.info.guilds.includes(message.guild.id))
      return; // return if we're not supposed to be used here
    if (
      command.info.category === "Roleplay" &&
      !marriage.includes(command.info.name) &&
      disallowedTabi.includes(message.author.id)
    )
      return message.react("<a:DuckyNo:697121081999360087>").catch(() => null);

    const disabled =
      this.instance.settings[message.guild.id][
        `category:${command.info.category.toLowerCase()}:disabled`
      ] ||
      this.instance.settings[message.guild.id][
        `cmd:${command.info.name}:disabled`
      ];
    if (disabled) {
      if (
        !message.member.permissions.has("Administrator") &&
        !owner.includes(message.author.id)
      )
        return; // command is disabled and they're not an admin/owner, nothing to do here
      // otherwise...
      message.react("<:Sirona_yesh:762603569538531328>").catch(() => null); // give an indicator they're breaking the law™️
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
          if (result === false) sendUsage(message.channel, command.help);
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
