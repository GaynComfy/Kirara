// with this, I can show that the one of the few things
// I've played with... is dates. this hurts
// todo: recode

const nextDate = () => {
  const today = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    })
  );
  let year = today.getFullYear();
  let month = today.getMonth();
  if (today.getDay() >= 28) {
    month += 1;
  }
  if (month > 11) {
    year += 1;
    month = 0;
  }

  return new Date(
    new Date(year, month, 28).toLocaleString("en-US", {
      timeZone: "America/New_York",
    })
  );
};

const timeLeft = () => {
  const next = nextDate();
  const today = new Date();
  return next.getTime() - today.getTime();
};

module.exports = {
  nextDate,
  timeLeft,
};
