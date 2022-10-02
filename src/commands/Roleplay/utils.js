const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");

const generateRolePlayEmbed = (sentence, from, to) => {
  return new EmbedBuilder()
    .setDescription(`**<@!${from}>** ${sentence} **<@!${to}>**!`)
    .setColor(Color.white);
};

const withCount = async (instance, type, userId, targetId, handler) => {
  // ToDo: Implement separate count for married couples

  let received;
  let send;
  const { rows } = await instance.database.pool.query(
    "SELECT * FROM ROLEPLAY_COUNT WHERE (discord_id = $1 AND type = $3) OR (discord_id = $2 AND type = $3)",
    [userId, targetId, type]
  );
  const result = rows.find(e => e.discord_id === userId);
  const resultTarget = rows.find(e => e.discord_id === targetId);
  if (!result) {
    await instance.database.simpleInsert("ROLEPLAY_COUNT", {
      discord_id: userId,
      send: 1,
      received: 0,
      type,
    });
    send = 1;
    received = 0;
  } else {
    send = Number.parseInt(result.send) + 1;
    received = Number.parseInt(result.received);
    await instance.database.simpleUpdate(
      "ROLEPLAY_COUNT",
      {
        discord_id: userId,
        type,
      },
      {
        send,
      }
    );
  }
  if (!resultTarget)
    await instance.database.simpleInsert("ROLEPLAY_COUNT", {
      discord_id: targetId,
      send: 0,
      received: 1,
      type,
    });
  else
    await instance.database.simpleUpdate(
      "ROLEPLAY_COUNT",
      {
        discord_id: targetId,
        type,
      },
      {
        received: Number.parseInt(resultTarget.received) + 1,
      }
    );

  handler({ send, received });
};

const getMarriage = async (instance, userId, limit = false) => {
  const { rows: marriages } = await instance.database.pool.query(
    "SELECT * FROM MARRIAGE WHERE asker=$1 OR married=$1" +
      (limit ? " LIMIT 1" : ""),
    [userId]
  );
  const married = [];
  marriages.forEach(m => {
    const asker = m.asker === userId;
    const user = asker ? m.married : m.asker;
    married.push({
      id: m.id,
      user,
      asker,
      date: m.date_added,
    });
  });
  return married;
};

module.exports = {
  generateRolePlayEmbed,
  withCount,
  getMarriage,
};
