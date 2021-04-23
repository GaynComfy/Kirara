exports.withCount = async (instance, type, userId, targetId, handler) => {
  let received;
  let send;
  const {
    rows,
  } = await instance.database.pool.query(
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
