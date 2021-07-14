module.exports = {
  execute: async (instance, oldMember, newMember) => {
    if (!newMember.guild || newMember.guild.id !== "378599231583289346") return;
    if (oldMember.premiumSince && !newMember.premiumSince) {
      const channel = newMember.guild.channels.cache.get("704084460336971906");
      if (!channel) {
        console.error("bot config channel not found for member stop boost");
        return;
      }
      await channel.send(
        `User: ${newMember.user.username}[${newMember.id}] Stopped boosting.`
      );
    }
  },
  eventName: "guildMemberUpdate",
};
