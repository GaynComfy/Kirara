const { MessageEmbed } = require("discord.js");

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
  for (const question of questions) {
    // /quiz slash command
    cmd = await instance.client.api
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

    // question embed
    const left = options.interval / 1000;
    const embed = new MessageEmbed()
      .setTitle(question.name)
      .setDescription(
        `${question.description}\n\nYou have ${left} seconds to answer using \`/quiz\`!`
      );
    question.answers.forEach(elem =>
      embed.addField(`Answer ${elem.key}`, elem.description)
    );
    if (question.image) embed.setImage(question.image);
    const msg = await channel.send(embed);
    current = {
      name: question.name,
      answers: {},
      correct: question.correct,
      start: Date.now(),
    };
    // ToDo: are we sure we want a sleep here? or maybe a service?
    await sleep(options.interval);

    // results of the question
    const correct = current.answers
      .filter(entry => entry.answer === question.correct)
      .sort((a, b) => a.time - b.time);
    const answer = question.answers.find(q => q.key === question.correct);
    if (correct.length > 0) {
      const winners = Object.keys(correct).map(
        (uid, i) =>
          `> ` +
          (i === 0 ? "<a:Sirona_star:748985391360507924>" : `**${i + 1}.**`) +
          ` <@!${uid}>`
      );

      const results = new MessageEmbed()
        .setColor("#ada")
        .setTitle(`${question.name} results`)
        .setDescription(question.description)
        .addField(`${answer.key}: ${answer.description}`, winners)
        .setField(
          `${correct.length} of ${current.answers.length} participants got it right!`
        );
      await msg.edit(results);
    } else {
      const results = new MessageEmbed()
        .setColor("#d33")
        .setTitle(`${question.name} results`)
        .setDescription(
          `${question.description}\n\n**Nobody got it right!** The answer was:\n> ${answer.key}: ${answer.description}`
        )
        .setField(`${current.answers.length} participants tried!`);
      await msg.edit(results);
    }

    answers.push(current);
    current = null;
    await sleep(8000);
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

  channel.send(finalEmbed);
};

module.exports = { runGame };
