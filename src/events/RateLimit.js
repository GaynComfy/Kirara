module.exports = {
  execute: async (instance, params) => {
    if (instance.client.rest.globalTimeout) {
      console.error("! GLOBAL RATELIMIT HIT");
    }
    console.error(
      `! Hit ratelimit on '${params.method} ${params.route}' => timeout ${params.timeout}`
    );
  },
  eventName: "rateLimit",
};
