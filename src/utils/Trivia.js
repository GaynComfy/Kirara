const { MessageEmbed, MessageAttachment } = require("discord.js");

const sleep = time => new Promise(r => setTimeout(r, time));

// ToDo: change this in the future as we develop this further
const questions = JSON.parse(
  require("fs").readFileSync("./src/assets/questions.json")
);

const shuffle = array => {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};
const getQuestions = async props => {
  const all = [...questions];
  return shuffle(all).slice(0, props.amount);
};

// sending the answer to the slash command to the user
const answerInteraction = (instance, interaction, type, content) => {
  const data = {
    type,
  };
  if (content)
    data.data = {
      content,
      flags: 64,
    };
  return instance.client.api
    .interactions(interaction.id, interaction.token)
    .callback.post({ data });
};

// the whole game handler
const runGame = async (instance, channel, guild, participants, options) => {
  const questions = await getQuestions(options);
  const answers = [];
  let current = null;
  instance.trivia[guild.id] = {
    running: true,
    onInteraction: interaction => {
      const { user } = interaction.member;
      if (!current || !participants[user.id]) {
        return answerInteraction(
          instance,
          interaction,
          4,
          "You are not participating on this quiz!"
        );
      }
      if (current.answers[user.id]) {
        return answerInteraction(
          instance,
          interaction,
          4,
          "You already answered this question!"
        );
      }
      current.answers[user.id] = {
        answer: interaction.data.options[0].value,
        time: Date.now() - current.start,
      };
      return answerInteraction(
        instance,
        interaction,
        4,
        "Your answer has been recorded!"
      );
    },
    slashName: "quiz",
    options,
    participants,
  };
  let cmd = null;

  // run all the questions
  let index = 0;
  for (const question of questions) {
    index++;
    // /quiz slash command
    cmd = await instance.client.api
      .applications(instance.client.user.id)
      .guilds(guild.id)
      .commands.post({
        data: {
          name: "quiz",
          description: `Answer Question #${index}`,
          options: [
            {
              name: "answer",
              description: `Answer: ${question.description}`,
              type: 3,
              required: true,
              choices: question.answers.map(answer => ({
                value: answer.key,
                name: `${answer.key}: ${answer.description}`,
              })),
            },
          ],
        },
      });

    // question embed
    const left = options.interval / 1000;
    const embed = new MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`Question #${index}`)
      .setDescription(question.description)
      .setFooter(`You have ${left} seconds to answer using /quiz`);
    question.answers.forEach(elem =>
      embed.addField(`Answer ${elem.key}`, elem.description)
    );
    if (question.image) embed.setImage(question.image);
    const msg = await channel.send({ embeds: [embed] });
    current = {
      name: question.name,
      answers: {},
      correct: question.correct,
      start: Date.now(),
    };
    // ToDo: are we sure we want a sleep here? or maybe a service?
    await sleep(options.interval);

    // results of the question
    let correct = [];
    Object.keys(current.answers).forEach(id => {
      const entry = current.answers[id];
      const good = entry.answer === question.correct;
      if (good) correct.push({ id, ...entry });
    });
    correct = correct.sort((a, b) => a.time - b.time);

    const answer = question.answers.find(q => q.key === question.correct);
    const all = Object.keys(current.answers).length;
    if (correct.length > 0) {
      const winners = correct
        .slice(0, 10)
        .map(
          (entry, i) =>
            `> ` +
            (i === 0 ? "<a:Sirona_star:748985391360507924>" : `**${i + 1}.**`) +
            ` <@!${entry.id}>`
        );

      const results = new MessageEmbed()
        .setColor("#aaddaa")
        .setTitle(`${question.name} results`)
        .setDescription(question.description)
        .addField(`${answer.key}: ${answer.description}`, winners.join("\n"))
        .setFooter(`${correct.length} of ${all} participants got it right!`);
      await msg.edit({ embeds: [results] });
    } else {
      const results = new MessageEmbed()
        .setColor("#dd3333")
        .setTitle(`${question.name} results`)
        .setDescription(
          `${question.description}\n\n**Nobody got it right!** The answer was:\n> ${answer.key}: ${answer.description}`
        )
        .setFooter(`${all} participants tried!`);
      await msg.edit({ embeds: [results] });
    }

    answers.push(current);
    current = null;
    if (index < questions.length) await sleep(3000);
  }

  // trivia has ended.
  instance.trivia[guild.id] = null;
  await instance.client.api
    .applications(instance.client.user.id)
    .guilds(guild.id)
    .commands(cmd.id)
    .delete({
      data: {},
    });

  const top = {};
  answers.forEach(question => {
    Object.keys(question.answers).forEach(userHash => {
      const entry = question.answers[userHash];
      const correct = entry.answer === question.correct;
      if (top[userHash]) {
        top[userHash].time += entry.time;
        top[userHash][correct ? "correct" : "wrong"].push(question.name);
      } else {
        top[userHash] = {
          correct: correct ? [question.name] : [],
          wrong: !correct ? [question.name] : [],
          id: userHash,
          time: entry.time,
          name: participants[userHash].name,
        };
      }
    });
  });
  const sorted = Object.values(top)
    .sort((a, b) => a.time - b.time)
    .sort((a, b) => b.correct.length - a.correct.length);
  const allCorrect = sorted.filter(e => e.correct.length === questions.length);
  const noCorrect = sorted.filter(e => e.wrong.length === questions.length);
  const participated = sorted.filter(
    e => e.correct.length + e.wrong.length === questions.length
  );
  const infoStr = participated
    .map(
      entry =>
        `${entry.name}[${entry.id}]: ${entry.correct.length} / ${
          entry.wrong.length
        } Average time: ${(entry.time / questions.length / 1000).toFixed(
          2
        )} Secs\n${[
          ...entry.correct.map(name => `\tCorrect: ${name}`),
          ...entry.wrong.map(name => `\tWrong ${name}`),
        ].join("\n")}`
    )
    .join("\n");
  options.source.author.createDM().then(dmChannel => {
    const attachment = new MessageAttachment(
      Buffer.from(infoStr, "utf-8"),
      "users.txt"
    );
    dmChannel.send({
      content: "Participants for last quiz",
      files: [attachment],
    });
  });
  const friends = sorted
    .slice(0, 10)
    .map(
      (entry, i) =>
        `> ` +
        (i === 0 ? "<a:Sirona_star:748985391360507924>" : `**${i + 1}.**`) +
        ` <@!${entry.id}> • ${entry.correct.length}/${
          entry.correct.length + entry.wrong.length
        }`
    );

  const finalEmbed = new MessageEmbed()
    .setColor("#bbffbb")
    .setTitle("Quiz results!")
    .addField("Participants", Object.keys(participants).length, true)
    .addField("Players", sorted.length, true)
    .addField("Questions", questions.length, true)
    .addField("Perfect Players", allCorrect.length, true)
    .addField("Confused Players", noCorrect.length, true)
    .addField("Loyal Players", participated.length, true)
    .addField("Leaderboard", friends)
    .setFooter("Thank you for participating into this quiz with us!");

  return channel.send({ embeds: [finalEmbed] });
};

module.exports = { runGame };
