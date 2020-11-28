module.exports = {
  prefix: "sb!",
  database: {
    host: "database",
    user: "kirara",
    database: "kirara",
    password: "kirara",
    port: 5432,
  },
  cache: {
    host: "redis",
    port: 6379,
  },
  structure: {
    commands: "commands",
    events: "events",
    services: "services",
  },
  owner: ["195906408561115137"],
  shardCount: 2,
  season: 1
};
