const {
  get: getLastCommand,
  del: deleteLastCommand,
} = require("../../utils/ReRun.js");

const info = {
  name: "!",
  matchCase: false,
  category: "UwU",
};
module.exports = {
  execute: async (instance, message) => {
    const value = await getLastCommand(instance, message.author.id);
    if (value) {
      const target = message;
      target.content = value.content;
      const res = instance.eventManager.reRun(
        value.command,
        target,
        value.args
      );
      if (!res) deleteLastCommand(instance, message.author.id);
    }
    return true;
  },
  info,
  help: {
    usage: "!",
    examples: ["!"],
    description: "Re runs last command if it was executed successfully.",
  },
};
