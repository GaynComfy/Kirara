const got = require("got");

class lillieClient {
  constructor(prefixURL, token) {
    this.instance = got.extend({
      prefixURL,
      headers: { "x-kirara-verify": token },
      responseType: "json",
      throwHttpErrors: false,
    });
  }
  async request(route) {
    const req = await this.instance.get(route);
    return req.data;
  }
}

module.exports = new lillieClient(
  process.env.LILLIE_URL,
  process.env.LILLIE_TOKEN
);
