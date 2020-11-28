module.exports = {
  prefix: "sb!",
  database: {
    host: "127.0.0.1",
    user: "kirara",
    database: "kirara",
    port: 5432,
  },
  cache: {
    host: "127.0.0.1",
    port: 6379,
  },
  structure: {
    commands: "commands",
    events: "events",
    services: "services",
  },
  owner: ["195906408561115137"],
  shardCount: 2,
  season: 1,
};
