const axios = require("axios").default;

class lillieClient {
  constructor(baseURL, token) {
    this.instance = axios.create({
      baseURL,
      headers: { "x-kirara-verify": token },
      timeout: 500,
    });
  }
  async request(route) {
    const req = await this.instance.get(`/${route}`);
    return req.data;
  }
}

module.exports = new lillieClient(
  process.env.LILLIE_URL,
  process.env.LILLIE_TOKEN
);
