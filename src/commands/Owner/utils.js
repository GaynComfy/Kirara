const minuteInSeconds = 60;
const hoursInSeconds = minuteInSeconds * 60;
const daysInSeconds = hoursInSeconds * 24;
const weekInSeconds = daysInSeconds * 7;

exports.getInfo = () => {
  const uptime = process.uptime();

  const upWeeks =
    uptime >= weekInSeconds ? Math.floor(uptime / weekInSeconds) : 0;
  const upDays =
    upWeeks !== 0
      ? Math.floor((uptime % weekInSeconds) / daysInSeconds)
      : Math.floor(uptime / daysInSeconds);
  const upHours =
    upDays !== 0
      ? Math.floor((uptime % daysInSeconds) / hoursInSeconds)
      : Math.floor(uptime / hoursInSeconds);
  const upMinutes =
    upHours !== 0
      ? Math.floor((uptime % hoursInSeconds) / minuteInSeconds)
      : Math.floor(uptime / minuteInSeconds);
  const upSecs = upMinutes !== 0 ? Math.floor(uptime % upMinutes) : uptime;
  const cpuusage = process.cpuUsage();
  const cpu = Math.floor(cpuusage.user / cpuusage.system) + "%";
  return {
    upWeeks,
    upDays,
    upHours,
    upMinutes,
    upSecs,
    cpu,
  };
};
