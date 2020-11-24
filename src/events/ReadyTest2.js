module.exports = {
  execute: async (instance, params) => {
    console.log(`Logged in as ${instance.client.user.id}!`);
  },
  init: async (instance) => {},
  eventName: "ready",
};
