module.exports = {
  execute: async (instance, params) => {
    if (instance.client.rest.globalTimeout) {
      console.error(`[${instance.client.shard.ids[0]}] ! GLOBAL RATELIMIT HIT`);
    }
    console.error(
      `[${instance.client.shard.ids[0]}] ! Hit ratelimit on '${params.method} ${params.route}' => timeout ${params.timeToReset}`
    );
  },
  eventName: "rateLimited",
};
