class TimeoutError extends Error {}

exports.timeout = (
  func,
  time,
  exception = new TimeoutError("Timeout exceeded")
) => {
  let timer;
  return Promise.race([
    func,
    new Promise((_, reject) => (timer = setTimeout(reject, time, exception))),
  ]).finally(() => clearTimeout(timer));
};

/**
 * @param {require('discord.js').Message} msg
 * @param {string[] || require('discord.js').Emoji} reacts
 */
exports.multiReact = async (msg, reacts) => {
  if (reacts.length === 1) return msg.react(reacts[0]);

  for (const react of reacts) {
    await msg.react(react);
    // wait 0.85s - should be enough latency considered
    await new Promise(resolve => setTimeout(resolve, 850));
  }
};
