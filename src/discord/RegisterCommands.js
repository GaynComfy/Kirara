const {
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandNumberOption,
  SlashCommandUserOption,
  SlashCommandChannelOption,
  SlashCommandBooleanOption,
  SlashCommandRoleOption,
  REST,
  Routes,
} = require("discord.js");

const ARGUMENT_REGISTER = {
  user: () => new SlashCommandUserOption(),
  string: () => new SlashCommandStringOption(),
  number: () => new SlashCommandNumberOption(),
  boolean: () => new SlashCommandBooleanOption(),
  channel: () => new SlashCommandChannelOption(),
  role: () => new SlashCommandRoleOption(),
};
const NAME_MAP = {
  user: "addUserOption",
  string: "addStringOption",
  number: "addNumberOption",
  boolean: "addBooleanOption",
  channel: "addChannelOption",
  role: "addRoleOption",
};

module.exports = async (instance, commands, token = process.env.TOKEN) => {
  const slashCommands = [];
  for (const command of commands) {
    const builder = new SlashCommandBuilder()
      .setName(command.info.name)
      .setDescription(command.help.description)
      .setDMPermission(false);
    for (const argument of command.arguments) {
      if (!ARGUMENT_REGISTER[argument.type]) continue;
      const option = ARGUMENT_REGISTER[argument.type]();
      if (!argument.name || !argument.description) {
        console.error(
          "Command",
          command.info.name,
          "argument missing name or description"
        );
        continue;
      }
      option.setName(argument.name.toLowerCase());
      option.setRequired(argument.required);
      if (argument.description) option.setDescription(argument.description);
      if (argument.type === "string") {
        if (typeof argument.min === "number") {
          option.setMinLength(argument.min);
        }
        if (typeof argument.max === "number") {
          option.setMaxLength(argument.max);
        }
      }
      if (argument.type === "string" || argument.type === "number") {
        if (argument.options) {
          // [["Option 1", "the value"]]
          const mapped = argument.options.map(opt => ({
            name: opt[0],
            value: opt[1],
          }));
          option.setChoices(...mapped);
        }
      }
      builder[NAME_MAP[argument.type]](option);
    }
    slashCommands.push(builder.toJSON());
  }
  const rest = new REST().setToken(token);
  const target = instance.config.isDev
    ? Routes.applicationGuildCommands(
        instance.config.clientId,
        instance.config.devServerId
      )
    : Routes.applicationGuildCommands(
        instance.config.clientId,
        instance.config.devServerId
      );
  const result = await rest.put(target, { body: slashCommands });
  return result;
};
