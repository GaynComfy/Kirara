module.exports = {
  execute: async (instance, oldMember, newMember) => {
    if (!newMember.guild || newMember.guild.id !== "378599231583289346") return;
    const channel = newMember.guild.channels.cache.get("939430390848958464");
    if (!channel) {
      console.error("bot config channel not found for member stop boost");
      return;
    }
    if (oldMember.premiumSince && !newMember.premiumSince) {
      await channel.send(
        `User <@!${newMember.user.id}> [${newMember.user.id}] stopped boosting.`
      );
    } else if (newMember.premiumSince && !oldMember.premiumSince) {
      await channel.send(
        `User <@!${newMember.user.id}> [${newMember.user.id}] is now boosting.`
      );
    }
  },
  eventName: "guildMemberUpdate",
};
