const cardId =
  /^(https?:\/\/(animesoul\.com|shoob\.gg)\/cards\/info\/)?([a-z0-9]{24})$/;
const aucId =
  /^(https?:\/\/(animesoul\.com|shoob\.gg)\/auction\/)?([a-z0-9]{24})$/;
const mention = /<@!?(\d{17,19})>/;
const userId = /\d{17,19}/;

module.exports = {
  cardId,
  aucId,
  mention,
  userId,
};
