const humanizeDuration = require("humanize-duration");

module.exports = {
  execute: async (instance, oldMember, newMember) => {
    if (!newMember.guild || newMember.guild.id !== "378599231583289346") return;
    const channel = newMember.guild.channels.cache.get("704084460336971906");
    if (!channel) {
      console.error("bot config channel not found for member stop boost");
      return;
    }

    const now = Date.now();
    const settings = { round: true, units: ["y", "mo", "w", "d", "h", "m"] };
    const oldSince = humanizeDuration(
      now - oldMember.premiumSinceTimestamp || 0,
      settings
    );
    const newSince = humanizeDuration(
      now - newMember.premiumSinceTimestamp || 0,
      settings
    );

    if (oldMember.premiumSince && !newMember.premiumSince) {
      // user stopped boosting
      await channel.send(
        `User <@!${newMember.user.id}> [${newMember.user.id}] stopped boosting after ${oldSince}.`
      );
    } else if (newMember.premiumSince && !oldMember.premiumSince) {
      // user is now boosting
      await channel.send(
        `User <@!${newMember.user.id}> [${newMember.user.id}] is now boosting. (${newSince})`
      );
    } else if (
      oldMember.premiumSinceTimestamp > newMember.premiumSinceTimestamp
    ) {
      // timestamp for booster changed (boost change)
      await channel.send(
        `User <@!${newMember.user.id}> [${newMember.user.id}] changed boost time from ${oldSince} to ${newSince}.`
      );
    }
  },
  eventName: "guildMemberUpdate",
};
