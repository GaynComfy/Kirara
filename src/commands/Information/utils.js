const lillieClient = require("../../utils/lillieClient");

exports.getLilliePing = async () => {
  try {
    const then = Date.now();
    const data = await lillieClient.request("ping");
    const now = Date.now() - then;
    return {
      ping: `${now}ms`,
      message: data.message,
      version: data.version,
    };
  } catch (err) {
    return { ping: "failure" };
  }
};
