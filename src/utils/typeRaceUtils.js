const tcaptcha = require("trek-captcha");
const { CaptchaGenerator } = require("captcha-canvas");
const { createCanvas, registerFont } = require("canvas");
const { tierInfo } = require("./cardUtils");
registerFont("./src/assets/Porter.ttf", { family: "Porter" });

const optout = require("./cacheUtils").getOptOutStmt(
  "TYPERACE_STATS.discord_id"
);

const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const randomStr = len => {
  let rStr = "";
  for (let i = 0; i < len; i++) {
    let rPos = Math.floor(Math.random() * charSet.length);
    rStr += charSet.substring(rPos, rPos + 1);
  }
  return rStr;
};

const colors = {};
const tColors = [];
Object.values(tierInfo).forEach(t => {
  colors[t.num] = t.color;
  tColors.push(t.color);
});

const diffs = {
  e: "easy",
  m: "medium",
  h: "hard",
  i: "impossible",
  c: "collect",
  s: "shoob",
  p: "spawn",
};
const difficulty = {
  easy: 6,
  medium: 8,
  hard: 10,
  impossible: 14,
  collect: 8,
  shoob: 5,
  spawn: 6,
};

const defs = {
  top: 0,
  last: 0,
  first: 0,
  total: 0,
  cid: 0,
};

const getCpm = (diff, time) => {
  const chars = difficulty[diff];
  if (chars === null) return 0;

  return Math.round((chars / parseFloat(time)) * 60);
};

const getTopPlayers = async (instance, limit) => {
  const k = "typerace:all";
  const exists = await instance.cache.exists(k);
  if (exists) {
    const e = await instance.cache.get(k);
    return JSON.parse(e);
  }

  const diffPlayers = [];
  for (const diff of Object.values(diffs)) {
    const { rows } = await instance.database.pool.query(
      "SELECT * FROM TYPERACE_STATS WHERE DIFFICULTY = $1 AND " +
        optout +
        " ORDER BY top ASC LIMIT $2",
      [diff, limit]
    );

    diffPlayers.push({
      difficulty: diff,
      users: rows,
    });
  }

  instance.cache.setExpire(k, JSON.stringify(diffPlayers), 60 * 14);
  return diffPlayers;
};

const getTopPlayersByDiff = async (instance, diff, limit, offset) => {
  const { rows } = await instance.database.pool.query(
    "SELECT * FROM TYPERACE_STATS WHERE DIFFICULTY = $1 AND " +
      optout +
      " ORDER BY top ASC LIMIT $2 OFFSET $3",
    [diff, limit, offset]
  );

  return rows;
};

const userAllInfo = async (instance, userId) => {
  const { rows } = await instance.database.pool.query(
    "SELECT difficulty, top, last, first, total, cid FROM TYPERACE_STATS WHERE discord_id = $1 AND " +
      optout,
    [userId]
  );

  const user = {
    discord_id: userId,
    diffs: [],
    played: rows.length === 0,
  };
  const diff = Object.values(diffs);
  diff.forEach(d => {
    const st = rows.find(di => di.difficulty === d) || {};
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
  const { rows } = await instance.database.pool.query(
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
const userPlay = async (instance, userId, diff, first, last, cid) => {
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
        cid: last < lastTop ? cid : result.cid,
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
      cid,
    });

    return null;
  }
};

// ---

const genShoobCaptcha = async () => {
  const { buffer, token } = await tcaptcha({ style: 0 });

  return { buffer, txt: token };
};

const genCollectCaptcha = async tier => {
  const captcha = createCanvas(300, 32);
  const ctx = captcha.getContext("2d");
  const chars = randomStr(8);

  ctx.lineWidth = "1px";
  ctx.font = "36px Porter";
  ctx.textAlign = "left";
  if (tier) ctx.fillStyle = colors[tier];
  else ctx.fillStyle = tColors[Math.floor(Math.random() * tColors.length)];

  let i = 0;
  while (i < 11) {
    ctx.rect(0, i * 3, 300, 2);
    i++;
  }
  ctx.fill();
  ctx.fillText(
    chars.replace(
      new RegExp(`(\\w{${Math.round(Math.random() * 2) * 2}})`),
      "$1 "
    ),
    5,
    28
  );

  return {
    buffer: captcha.toBuffer(),
    txt: chars.toLowerCase(),
  };
};

const genSpawnCaptcha = async () => {
  const characters = Math.round(4 + Math.random() * (6 - 4));
  const rColor = tColors[Math.floor(Math.random() * tColors.length)];

  const captcha = new CaptchaGenerator({ width: 270, height: 70 })
    .setCaptcha({
      characters,
      color: rColor,
      text: randomStr(characters),
      rotate: 5,
    })
    .setTrace({ color: rColor });

  return {
    buffer: await captcha.generate(),
    txt: captcha.text.toLowerCase(),
  };
};

const genRandomCaptcha = async diff => {
  if (!diff || !difficulty[diff]) diff = "hard";
  const captcha = new CaptchaGenerator({ width: 600, height: 200 })
    .setCaptcha({
      characters: difficulty[diff],
      color: "#8cbaff",
      text: randomStr(difficulty[diff]),
      rotate: 0,
    })
    .setDecoy({ opacity: difficulty[diff] >= 8 ? 0.8 : 0 })
    .setTrace({ color: "#8cbaff", opacity: difficulty[diff] < 14 ? 1 : 0 });

  return {
    buffer: await captcha.generate(),
    txt: captcha.text.toLowerCase(),
  };
};

const genCaptcha = async (diff = "hard", tier = false) => {
  switch (diff) {
    case "shoob":
      return genShoobCaptcha();
    case "spawn":
      return genSpawnCaptcha();
    case "collect":
      return genCollectCaptcha(tier);
    default:
      return genRandomCaptcha(diff);
  }
};

// ---

module.exports = {
  colors,
  diffs,
  difficulty,
  getCpm,
  getTopPlayers,
  getTopPlayersByDiff,
  userAllInfo,
  userInfo,
  userPlay,
  genShoobCaptcha,
  genCollectCaptcha,
  genRandomCaptcha,
  genCaptcha,
};
