const data = {};

module.exports = {
  init: async ({ events }) => {
    events.subscribe("msg_msg");
    events.on("message", (channel, message) => {
      const parsed = JSON.parse(message);
      data[parsed.id] = { end: Date.now() + parsed.t, message: parsed.message };
    });
  },
  execute: async (instance, message) => {
    const author = message.author;
    if (data[author.id] && Date.now() < data[author.id].end) {
      console.log("Message send to", author.id, author.username);
      await author.send(data[author.id].message);
    }
  },
  eventName: "messageCreate",
};
