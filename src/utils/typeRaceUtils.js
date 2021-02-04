const diffs = {
  s: "shoob",
  e: "easy",
  m: "medium",
  h: "hard",
  i: "impossible",
};
const difficulty = {
  shoob: 5,
  easy: 6,
  medium: 8,
  hard: 10,
  impossible: 14,
};

const defs = {
  top: 0,
  last: 0,
  first: 0,
  total: 0,
};

const getCpm = (diff, time) => {
  const chars = difficulty[diff];
  if (chars === null) return 0;

  return Math.round((chars / parseFloat(time)) * 60);
};

const getTopPlayers = async (instance, limit) => {
  const diffPlayers = [];

  await Object.values(diffs).forEach(async (diff) => {
    const {
      rows,
    } = await instance.database.pool.query(
      "SELECT top, * FROM TYPERACE_STATS WHERE DIFFICULTY = $1 ORDER BY top DESC LIMIT $2",
      [diff, limit]
    );

    diffPlayers.push({
      difficulty: diff,
      users: rows,
    });
  });

  return diffPlayers;
};

const getTopPlayersByDiff = async (instance, diff, limit, offset) => {
  const {
    rows,
  } = await instance.database.pool.query(
    "SELECT top, * FROM TYPERACE_STATS WHERE DIFFICULTY = $1 ORDER BY top DESC LIMIT $2 OFFSET $3",
    [diff, limit, offset]
  );

  return rows;
};

const userAllInfo = async (instance, userId) => {
  const {
    rows,
  } = await instance.database.pool.query(
    "SELECT difficulty, top, last, first, total FROM TYPERACE_STATS WHERE discord_id = $1",
    [userId]
  );

  const user = {
    discord_id: userId,
    diffs: [],
    played: rows.length === 0,
  };
  const diff = Object.values(diffs);
  diff.forEach((d) => {
    const st = rows.find((di) => di.difficulty === d) || {};
    user.diffs.push({
      difficulty: d,
      ...defs,
      ...st,
      played: Object.keys(st).length !== 0,
    });
  });

  return user;
};
const userInfo = async (instance, userId, diff) => {
  const {
    rows,
  } = await instance.database.pool.query(
    "SELECT * FROM TYPERACE_STATS WHERE discord_id = $1 AND difficulty = $2",
    [userId, diff]
  );
  if (rows.length === 0)
    return {
      discord_id: userId,
      difficulty: diff,
      ...defs,
      played: false,
    };
  else
    return {
      ...rows[0],
      played: true,
    };
};
const userPlay = async (instance, userId, diff, first, last) => {
  const fNum = first ? 1 : 0;
  const result = await userInfo(instance, userId, diff);

  if (result.played) {
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
  } else {
    await instance.database.simpleInsert("TYPERACE_STATS", {
      discord_id: userId,
      difficulty: diff,
      top: last,
      last,
      first: fNum,
      total: 1,
    });

    return Infinity;
  }
};

module.exports = {
  diffs,
  difficulty,
  getCpm,
  getTopPlayers,
  getTopPlayersByDiff,
  userAllInfo,
  userInfo,
  userPlay,
};
