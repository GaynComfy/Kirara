const { withRights } = require("../../utils/hooks");
const { EmbedBuilder } = require("discord.js");
const THRESH_HOLD = 1200;
const ROLE_ID = "902758184794595380";

const info = {
  name: "points",
  aliases: ["pt"],
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
  cooldown: 5,
  disabled: process.env.NODE_ENV !== "development",
};
const maybeGrantRole = async (instance, id, value) => {
  const has = await instance.cache.exists(`xpcount_role:${id}`);
  if (has && value < THRESH_HOLD) {
    try {
      const guild = instance.client.guilds.cache.get("378599231583289346");
      if (!guild) return;
      const member = guild.members.cache.get(id);
      if (!member) return;
      await member.roles.remove(ROLE_ID);
      await instance.cache.delete(`xpcount_role:${id}`);
    } catch {}
  } else if (!has && value >= THRESH_HOLD) {
    try {
      const guild = instance.client.guilds.cache.get("378599231583289346");
      if (!guild) return;
      const member = guild.members.cache.get(id);
      if (!member) return;
      await member.roles.add(ROLE_ID);
      await instance.cache.set(`xpcount_role:${id}`, "1");
    } catch {}
  }
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0) return false;
      if (args[0] === "top") {
        const keys = await instance.cache.keys("xpcount:*");
        const values = await Promise.all(
          keys.map(
            key =>
              new Promise(resolve => {
                instance.cache.get(key).then(val => {
                  resolve({
                    value: val,
                    id: key.split(":")[1],
                  });
                });
              })
          )
        );
        const sorted = values.sort((a, b) => b.value - a.value);
        const embed = new EmbedBuilder()
          .setTitle("xp highest for this week")
          .addFields([
            {
              name: "Top",
              value: sorted
                .slice(0, 10)
                .map((entry, index) => {
                  return `${index + 1}. <@!${
                    entry.id
                  }>: ${entry.value.toLocaleString()}`;
                })
                .join("\n"),
            },
          ]);
        message.channel.send({ embeds: [embed] });
        return true;
      }
      const id = args[0];

      if (args.length === 1) {
        const exists = await instance.cache.exists(`xpcount:${id}`);
        if (!exists) {
          message.reply("User has no points");
          return true;
        }
        const points = await instance.cache.get(`xpcount:${id}`);
        const role = await instance.cache.exists(`xpcount_role:${id}`);
        message.reply(`user has ${points} pts. Role granted ? ${role}`);
        return true;
      } else {
        switch (args[1]) {
          case "set": {
            const value = Number.parseInt(args[2]);
            if (Number.isNaN(value)) return false;
            await instance.cache.set(`xpcount:${id}`, value);
            await maybeGrantRole(instance, id, value);
            message.reply("done");
            return true;
          }
          case "change": {
            const value = Number.parseInt(args[2]);
            if (Number.isNaN(value)) return false;
            const val = await instance.cache.incrementBy(
              `xpcount:${id}`,
              value
            );
            if (val <= 0) {
              await instance.cache.delete(`xpcount:${id}`);
              await maybeGrantRole(instance, id, 0);
            } else {
              await maybeGrantRole(instance, id, val);
            }
            message.reply("done");
            return true;
          }
          case "delete": {
            await instance.cache.delete(`xpcount:${id}`);
            await maybeGrantRole(instance, id, 0);
            message.reply("done");
            return true;
          }
        }
      }
    });
  },
  info,
  help: {
    usage: "points <userid> [change/delete/set/top] [value]",
    examples: ["points @liz3 set 455"],
    description: "Manipulate a users points or see the top 10",
  },
};
