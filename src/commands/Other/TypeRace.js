const { MessageAttachment, MessageEmbed } = require('discord.js');
const { CaptchaGenerator } = require('captcha-canvas'); 

const info = {
  name: "typerace",
  matchCase: false,
  category: "UwU",
};
module.exports = {
  execute: async (instance, message, args) => {
    const argsd = args[0] || 'easy'
    const results = []
    const resultsw =[]
    const timer = []
    var startTime, endTime;

    const difficulty = {easy: 6, medium: 8, hard: 10};
const captcha = new CaptchaGenerator({height: 200, width: 600}).setCaptcha({characters: difficulty[argsd] ,color: "#8cbaff"}).setTrace({color: "#8cbaff"}); // CANVAS 
const buffer = await captcha.generateSync();  // IMG TO ATTACH
const txt = captcha.text.toLowerCase(); // TEXT FOR VAR
console.log(txt)

function start() {
  startTime = new Date();
};

function end() {
  endTime = new Date();
  var timeDiff = endTime - startTime; //in ms
  // strip the ms
  timeDiff /= 1000;

  // get seconds 
  var seconds = Math.round(timeDiff);
  return seconds;
}

    const attachment = new MessageAttachment(buffer, 'img.png')
    const embedSend =  new MessageEmbed()
    .attachFiles([attachment])
    .setImage('attachment://img.png'); 
    start()
    message.channel.send(embedSend)
    .then(msg => {
      const filter = msg => msg.content.toLowerCase().startsWith(`${txt}`);

      const collector = message.channel.createMessageCollector(filter, { time: 15000 });

      collector.on('collect', async m => {
        const wpm = (txt.length/5) / (end() /60)
        results.push(`${m.author.tag}`)
        resultsw.push(`${wpm}`)
        timer.push(`${end()}s`)
        const embed = new MessageEmbed()
      .setDescription(`You got the correct Answer! It took ${end()}s \n WPM: ${wpm}`)
      .setColor(0xe9a6ff)
      msg.channel.send(embed)
      })
      collector.on('end', collected => {
        if(results.length == 0) {
          return;
        } 
        const resultsE = new MessageEmbed()
        .addField('__User__', results, true)
        .addField('__WPM__', resultsw, true) 
        .addField('__Time__', timer, true)  
        message.channel.send(resultsE)            
      }) 
    })

  },
  info,
  help: {
    usage: "typerace",
    examples: ["typerace"],
    description: "typerace",
  },
};
