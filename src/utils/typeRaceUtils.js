exports.userPlay = async (instance, userId, diff, first, last) => {
  const fNum = first ? 1 : 0;
  const {
    rows,
  } = await instance.database.pool.query(
    "SELECT * FROM TYPERACE_STATS WHERE discord_id = $1 AND difficulty = $2",
    [userId, diff]
  );
  if (rows.length === 0) {
    await instance.database.simpleInsert("TYPERACE_STATS", {
      discord_id: userId,
      difficulty: diff,
      top: last,
      last,
      first: fNum,
      total: 1,
    });

    return 0;
  } else {
    const result = rows[0];
    const lastTop = parseFloat(result.top);

    await instance.database.simpleUpdate(
      "TYPERACE_STATS",
      {
        discord_id: userId,
        difficulty: diff,
      },
      {
        top: last < lastTop ? last : lastTop,
        last,
        first: parseInt(result.first) + fNum,
        total: parseInt(result.total) + 1,
      }
    );

    return lastTop;
  }
};
