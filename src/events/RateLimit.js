module.exports = {
  execute: async (instance, params) => {
    if (instance.client.rest.globalTimeout) {
      console.log("! GLOBAL RATELIMIT HIT");
    }
    console.log(
      `! Hit ratelimit on '${params.method} ${params.route}' => timeout ${params.timeout}`
    );
  },
  eventName: "rateLimit",
};
