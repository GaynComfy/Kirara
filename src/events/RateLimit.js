module.exports = {
  execute: async (instance, params) => {
    if (instance.client.rest.globalTimeout) {
      console.debug(`[${instance.client.shard.ids[0]}] ! GLOBAL RATELIMIT HIT`);
    }
    console.debug(
      `[${instance.client.shard.ids[0]}] ! Hit ratelimit on '${params.method} ${params.path}' => timeout ${params.timeout}`
    );
  },
  eventName: "rateLimit",
};
