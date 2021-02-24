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
