module.exports = {
  execute: async (instance, params) => {
    console.log(`Logged in as ${instance.client.user.tag}!`);
    instance.database.pool.query("SELECT NOW()", (err, res) => {
      console.log(err, res);
    });
  },
  init: async (instance) => {
    instance.database.pool.query("SELECT NOW()", (err, res) => {
      console.log(err, res);
    });

    console.log("on ready");
  },
  eventName: "ready",
};
