class DbFetcher {
  async fetchById(instance, id) {
    const k = `card:${id}`;
    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      return JSON.parse(e);
    }

    const query =
      "SELECT COUNT (id) c, issue, discord_id FROM card_claims WHERE claimed=true " +
      "AND card_id=$1 GROUP BY discord_id,issue ORDER BY issue";
    const { rows: claims } = await instance.database.pool.query(query, [
      card.id,
    ]);
    const top = [];
    const users = [];
    for (const claim of claims) {
      let result = await instance.client.users.fetch(claim.discord_id);
      if (!result) {
        result = {
          username: "Unknown user",
        };
      }
      top.push({
        discord_id: claim.discord_id,
        username: result.username,
        count: claim.c,
      });
      users.push({
        discord_id: claim.discord_id,
        username: result.username,
        issue: claim.issue,
      });
    }

    const card = {
      claims: claims.length,
      top,
      users,
    };
    instance.cache.setExpire(k, JSON.stringify(card), 60 * 5);
    return card;
  }

  async fetchOwners(instance, id, offset = "0", limit = "0") {
    const result = await this.fetchById(instance, id);
    return result.users.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );
  }
  async fetchCardCount(instance, id) {
    const result = await this.fetchById(instance, id);
    return result.claims;
  }
  async fetchTopOwners(instance, id, offset = "0", limit = "0") {
    const result = await this.fetchById(instance, id);
    return result.top.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );
  }
}

module.exports = new DbFetcher();
