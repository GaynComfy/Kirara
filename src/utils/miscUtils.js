class TimeoutError extends Error {}

exports.timeout = (
  promise,
  time,
  exception = new TimeoutError("Timeout exceeded")
) => {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject) => (timer = setTimeout(reject, time, exception))),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

/**
 * @param {require('discord.js').Message} msg
 * @param {string[] | require('discord.js').Emoji[]} reacts
 */
exports.multiReact = async (msg, reacts) => {
  if (reacts.length === 1) return await msg.react(reacts[0]);

  for (const react of reacts) {
    await msg.react(react);
    // wait 0.65s - should be enough latency considered
    await new Promise(resolve => setTimeout(resolve, 650));
  }
};
