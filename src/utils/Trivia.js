const { MessageEmbed } = require("discord.js");
const sleep = time => new Promise(r => setTimeout(r, time));
const getQuestions = async props => {
  return [
    {
      props,
      name: "Some question",
      description: "",
      correct: "B",
      image: "",
      answers: [
        {
          key: "A",
          description: "Apple",
        },
        {
          key: "B",
          description: "GNU is superior",
        },
        {
          key: "C",
          description: "Banana",
        },
      ],
    },
  ];
};
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
const runGame = async (instance, channel, guild, participants, options) => {
  const questions = await getQuestions(options);
  const answers = [];
  let current = null;
  instance.trivia[guild.id] = {
    running: true,
    onInteraction: interaction => {
      const { user } = interaction.member;
      if (!current || !participants[user.id]) {
        answerInteraction(instance, interaction, 1, null);
        return;
      }
      if (current.answers[user.id]) {
        answerInteraction(instance, interaction, 1, null);
        return;
      }
      current.answers[user.id] = {
        answer: interaction.data.options[0].value,
        time: Date.now() - current.start,
      };
      answerInteraction(
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

  for (const question of questions) {
    current = null;
    await instance.client.api
      .applications(instance.client.user.id)
      .guilds(guild.id)
      .commands.post({
        data: {
          name: "quiz",
          description: `Answer ${question.name}`,
          options: [
            {
              name: "answer",
              description: "Answer to the given question",
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
    current = { name: question.name, answers: {}, correct: question.correct };
    const embed = new MessageEmbed()
      .setTitle(question.name)
      .setDescription(question.description + `\nYou have 60 seconds to answer`);
    question.answers.forEach(elem =>
      embed.addField(`Answer: ${elem.key}`, elem.description)
    );
    if (question.image) embed.setImage(question.image);
    await channel.send(embed);
    current.start = Date.now();
    await sleep(1000 * 60);
    answers.push(current);
  }
  instance.trivia[guild.id] = null;
  const top = {};
  answers.forEach(questionResult => {
    Object.keys(questionResult.answers).forEach(userHash => {
      const entry = questionResult.answers[userHash];
      const correct = entry.answer === questionResult.correct;
      if (top[userHash]) {
        top[userHash].time += entry.time;
        top[userHash][correct ? "correct" : "wrong"].push(questionResult.name);
      } else {
        top[userHash] = {
          correct: correct ? [questionResult.name] : [],
          wrong: !correct ? [questionResult.name] : [],
          id: userHash,
          time: entry.time,
        };
      }
    });
  });
  const sorted = Object.values(top)
    .sort((a, b) => b.correct.length - a.correct.length)
    .sort((a, b) => a.time - b.time);
  const allCorrect = sorted.filter(e => e.correct.length === questions.length);
  const noCorrect = sorted.filter(e => e.wrong.length === questions.length);
  const finalEmbed = new MessageEmbed()
    .setTitle("Quiz result")
    .setDescription(
      `Result of this quiz:\n${allCorrect.length} got everything right\n${noCorrect.length} got everything wrong\n${sorted.length} participated`
    );
  sorted.slice(0, 3).forEach((e, i) => {
    finalEmbed.addField(`${i + 1}. Place`, participants[e.id].name);
  });
};
module.exports = { runGame };
