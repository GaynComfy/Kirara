module.exports = {
  execute: async instance => {
    console.log("ready", instance.client.shard.ids[0]);
  },
  eventName: "ready",
};
