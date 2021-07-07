const cardId = /^(https?:\/\/animesoul\.com\/cards\/info\/)?([a-z0-9]{24})$/;
const aucId = /^(https?:\/\/animesoul\.com\/auction\/)?([a-z0-9]{24})$/;
const mention = /<@!?(\d{17,19})>/;
const userId = /\d{17,19}/;

module.exports = {
  cardId,
  aucId,
  mention,
  userId,
};
