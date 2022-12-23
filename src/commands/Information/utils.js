const midoriClient = require("../../utils/midoriClient");

exports.getMidoriPing = async () => {
  try {
    const then = Date.now();
    const data = await midoriClient.request("ping");
    const now = Date.now() - then;
    return {
      ping: `${Math.round(now)}ms`,
      message: data.message,
      version: data.version,
    };
  } catch (err) {
    return { ping: "failure" };
  }
};
