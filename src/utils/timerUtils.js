// with this, I can show that the one of the few things
// I've played with... is dates. this hurts
// todo: recode

const nextDate = () => {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  if (today.getDay() >= 28) {
    month += 1;
  }
  if (month > 11) {
    year += 1;
    month = 1;
  }

  return new Date(year, month, 28);
};

const timeLeft = () => {
  const next = nextDate();
  const today = new Date();
  const timeDiff = Math.abs(next.getTime() - today.getTime());
  return Math.ceil(timeDiff / 1000);
};

module.exports = {
  nextDate,
  timeLeft,
};
