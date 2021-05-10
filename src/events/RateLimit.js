module.exports = {
  execute: async (instance, params) => {
    if (instance.client.rest.globalTimeout) {
      console.log("! GLOBAL RATELIMIT HIT");
    }
    console.debug(
      `[${instance.client.shards[0]}] ! Hit ratelimit on '${params.method} ${params.path}' => timeout ${params.timeout}`
    );
  },
  eventName: "rateLimit",
};
