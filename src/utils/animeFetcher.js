const axios = require("axios").default;
const { parseString } = require("xml2js");
class Anime {
  constructor(data) {
    this.data = data;
  }
  getTitle(lang = "en") {
    const titles = this.data.titles[0].title;
    if (!titles) return null;
    for (const entry of titles) {
      const title = entry._;
      const meta = entry["$"];
      if (meta.type === "official" && meta["xml:lang"] === lang) return title;
    }
    return null;
  }
  _imageLinkWithId(id) {
    return `https://cdn-eu.anidb.net/images/main/${id}`;
  }
  getImageLink() {
    const id = this.data.picture[0];
    if (!id) return null;
    return this._imageLinkWithId(id);
  }
  getRating() {
    return this.data.ratings[0].permanent[0]?._;
  }
  getCharacters() {
    if (!this.characters)
      this.characters = this.data.characters[0].character.map(character => {
        return {
          name: character.name[0],
          gender: character.gender?.[0],
          id: character["$"]?.id,
          description: character.description?.[0] || "",
          image: this._imageLinkWithId(character.picture?.[0]),
          rating: character.rating?.[0]._,
        };
      });
    return this.characters;
  }
  getCreators() {
    if (!this.creators)
      this.creators = this.data.creators[0].name?.map(entry => {
        const name = entry._;
        const id = entry["$"].id;
        const type = entry["$"].type;
        return {
          name,
          id,
          type,
        };
      });
    return this.creators;
  }
  getFormattedDescription() {
    if (this._formattedDescription) return this._formattedDescription;
    const regex = /(http:\/\/anidb\.net\/c.+?) \[(.+?)\]/;
    let description = this.data.description[0];
    let newDescription = "";
    let match;
    while ((match = regex.exec(description))) {
      if (!match) break;
      const [full, url, name] = match;
      const index = match.index;
      if (index > 0) newDescription += description.substr(0, index);
      newDescription += `[${name}](${url})`;
      description = description.substr(index + full.length);
    }
    newDescription += description;
    if (newDescription.startsWith("* "))
      newDescription = newDescription.substr(2);
    this._formattedDescription = newDescription;
    console.log(newDescription);
    return this._formattedDescription;
  }
}
const parseXml = str => {
  return new Promise((resolve, reject) => {
    parseString(str, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
};

const fetchAnime = async aid => {
  const result = await axios.get("http://api.anidb.net:9001/httpapi", {
    params: {
      client: process.env.ANIDB_CLIENT,
      clientver: process.env.ANIDB_CLIENT_VERSION,
      protover: "1",
      request: "anime",
      aid,
    },
  });
  return parseXml(result.data);
};

const searchAnime = async (instance, term) => {
  const query = `select * from anime_list where (LOWER(title_en) LIKE ('%' || $1 || '%')) OR (title_jp LIKE ('%' || $1 || '%')) LIMIT 1`;
  const { rows } = await instance.database.pool.query(query, [
    term.toLowerCase(),
  ]);
  if (!rows.length) return null;
  const mapped = await Promise.all(
    rows.map(
      row =>
        new Promise((resolve, reject) => {
          if (row.has_data) {
            resolve(new Anime(row.data.anime));
            return;
          }
          console.log("fetching anime", row.aid);
          fetchAnime(row.aid)
            .then(res => {
              instance.database
                .simpleUpdate(
                  "ANIME_LIST",
                  {
                    id: row.id,
                  },
                  {
                    has_data: true,
                    data: JSON.stringify(res),
                  }
                )
                .then(() => {
                  resolve(new Anime(res.anime));
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
    )
  );
  return mapped;
};

module.exports = {
  searchAnime,
};
