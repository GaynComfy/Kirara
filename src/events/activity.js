const karuta_regex = /<@!?(\d{17,19})> is dropping (\d) cards!/
const shoob_regex = /<@!?(\d{17,19})> is dropping a card for the Community, be the one to collect it!/
const THRESH_HOLD = 1200;
const ROLE_ID = "902758184794595380"
module.exports = {
    execute: async (instance, message) => {
        if (!message.guild || message.guild.id !== "378599231583289346" || message.channel.id === "695675260254814298") return;
        let spawnerFromBot = null;
        let cardMultiplier = 0;

        if(message.author.bot) {
            if(message.author.id === "646937666251915264" && karuta_regex.test(message.content)) {
                const info = karuta_regex.exec(message.content)
                 spawnerFromBot = info[1]
                cardMultiplier = Number.parseInt(info[2])
            } else if (message.author.id === "673362753489993749" && shoob_regex.test(message.content)) {
                const info = shoob_regex.exec(message.content)
                spawnerFromBot = info[1]
                cardMultiplier = 1;
            } else {
                return;
            }
        }

        const id = spawnerFromBot || message.author.id;
        const points = 5 + (5 * cardMultiplier);
        const key = `xpcount:${id}`
        const value = await instance.cache.incrementBy(key, points);
        if(value > THRESH_HOLD) {
            const role_key = `xpcount_role:${id}`
            if(! (await instance.cache.exists(role_key))) {
                await message.member.roles.add(ROLE_ID);
                instance.cache.set(role_key, "1");

            }
        }

    },
    eventName: "message"
}