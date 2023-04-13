const { EmbedBuilder } = require("discord.js");
const { searchAnime } = require("../../utils/animeFetcher.js");
const { createPagedResults } = require("../../utils/PagedResults");
const info = {
  name: "anime",
  matchCase: false,
  category: "UwU",
};

module.exports = {
  execute: async (instance, message, args) => {
    const term = args.join(" ");
    const result = await searchAnime(instance, term);
    if (!result) return;
    const [anime] = result;

    createPagedResults(
      message,
      2 + anime.getCharacters().length,
      async page => {
        const embed = new EmbedBuilder();
        embed.setTitle(anime.getTitle());

        if (page === 0) {
          embed.setDescription(anime.getFormattedDescription());
          embed.setImage(anime.getImageLink());
          embed.addFields([
            {
              name: "Rating",
              value: anime.getRating(),
            },
            {
              name: "Japanese Title",
              value: anime.getTitle("ja"),
            },
          ]);
        } else if (page === 1) {
          embed.setTitle(anime.getTitle() + ": Creators");
          embed.setDescription(
            anime
              .getCreators()
              .map(entry => `* ${entry.name}(${entry.type})`)
              .join("\n")
          );
        } else {
          const index = page - 2;
          const character = anime.getCharacters()[index];
          embed.setTitle("Character: " + character.name);
          embed.setDescription(character.description);
          embed.setImage(character.image);
          embed.addFields([
            {
              name: "Rating",
              value: character.rating,
              inline: true,
            },
            {
              name: "Gender",
              value: character.gender,
              inline: true,
            },
          ]);
        }
        embed.setFooter({
          text: "Data provided by anidb",
        });
        return embed;
      },
      false,
      null
    );
    return true;
  },
  info,
  help: {
    usage: "anime <name>",
    examples: ["anime railgun"],
    description: "Fetch Data about an anime",
  },
};
