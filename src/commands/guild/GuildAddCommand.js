/**
 * Allow to add a member to a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildAddCommand = async (language, message, args) => {
  let entity; let invitedEntity; let guild; let invitedGuild;
  let embed = new discord.MessageEmbed();

  [entity] = await Entities.getOrRegister(message.author.id);

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
    return;
  }

  if (await sendBlockedError(message.author, message.channel, language)) {
    return;
  }

  try {
    [invitedEntity] = await Entities.getByArgs(args, message);
  } catch (error) {
    invitedEntity = null;
  }

  if (invitedEntity == null) { // no user provided
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guildAdd.getTranslation(language).cannotGetInvitedUser);
  }

  if (await sendBlockedError(message.mentions.users.last(), message.channel, language)) {
    return;
  }

  // search for a user's guild
  try {
    guild = await Guilds.getById(entity.Player.guild_id);
  } catch (error) {
    guild = null;
  }

  if (guild == null) { // not in a guild
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guildAdd.getTranslation(language).notInAguild);
  }

  if (guild.chief_id != entity.id) {
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guildAdd.getTranslation(language).notChiefError);
  }

  // search for a user's guild
  try {
    invitedGuild = await Guilds.getById(invitedEntity.Player.guild_id);
  } catch (error) {
    invitedGuild = null;
  }

  if (invitedGuild != null) { // already in a guild
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guildAdd.getTranslation(language).alreadyInAGuild);
  }

  const members = await Entities.getByGuild(guild.id);

  if (members.length === GUILD.MAX_GUILD_MEMBER) {
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guildAdd.getTranslation(language).guildFull);
  }

  addBlockedPlayer(invitedEntity.discordUser_id, 'guildAdd');
  embed.setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).invitationTitle, {
    pseudo: message.mentions.users.last().username,
  }), message.mentions.users.last().displayAvatarURL());
  embed.setDescription(format(JsonReader.commands.guildAdd.getTranslation(language).invitation, {
    guildName: guild.name,
  }));

  const msg = await message.channel.send(embed);

  embed = new discord.MessageEmbed();
  const filterConfirm = (reaction, user) => {
    return ((reaction.emoji.name == MENU_REACTION.ACCEPT || reaction.emoji.name == MENU_REACTION.DENY) && user.id === message.mentions.users.last().id);
  };

  const collector = msg.createReactionCollector(filterConfirm, {
    time: 120000,
    max: 1,
  });

  collector.on('end', async (reaction) => {
    removeBlockedPlayer(invitedEntity.discordUser_id);
    if (reaction.first()) { // a reaction exist
      if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
        invitedEntity.Player.guild_id = guild.id;
        guild.updateLastDailyAt();

        await Promise.all([
          guild.save(),
          invitedEntity.save(),
          invitedEntity.Player.save(),
        ]);

        embed.setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).successTitle, {
          pseudo: message.mentions.users.last().username,
          guildName: guild.name,
        }), message.mentions.users.last().displayAvatarURL());
        embed.setDescription(JsonReader.commands.guildAdd.getTranslation(language).invitationSuccess);
        return message.channel.send(embed);
      }
    }

    // Cancel the creation
    return sendErrorMessage(
      message.mentions.users.last(),
      message.channel,
      language,
      format(JsonReader.commands.guildAdd.getTranslation(language).invitationCancelled, {
        guildName: guild.name,
      }));
  });

  await Promise.all([
    msg.react(MENU_REACTION.ACCEPT),
    msg.react(MENU_REACTION.DENY),
  ]);
};


module.exports = {
  'guildadd': GuildAddCommand,
  'gadd': GuildAddCommand,
  'ga': GuildAddCommand,
};