const karuta_regex = /<@!?(\d{17,19})> is dropping (\d) cards!/;

module.exports = {
  disabled: process.env.NODE_ENV !== "development",
  execute: async (instance, message) => {
    if (
      !message.guild ||
      message.guild.id !== "378599231583289346" ||
      message.author.id !== "646937666251915264" ||
      !karuta_regex.test(message.content)
    )
      return;

    const info = karuta_regex.exec(message.content);
    const spawner = info[1] || message.author.id;
    const cards = Number.parseInt(info[2]);

    const key = `kdrop:${message.guild.id}:${spawner}`;
    await instance.cache.incrementBy(key, cards);
  },
  eventName: "messageCreate",
};
