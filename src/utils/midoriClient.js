const axios = require("axios").default;
const http = require("http");

class midoriClient {
  constructor(baseURL, token) {
    this.instance = axios.create({
      baseURL,
      headers: { "x-kirara-verify": token },
      httpAgent: new http.Agent({ keepAlive: true }),
      timeout: 500,
    });
  }
  async request(route) {
    const req = await this.instance.get(`/${route}`);
    return req.data;
  }
}

module.exports = new midoriClient(
  process.env.MIDORI_URL || process.env.LILLIE_URL,
  process.env.MIDORI_TOKEN || process.env.LILLIE_TOKEN
);
