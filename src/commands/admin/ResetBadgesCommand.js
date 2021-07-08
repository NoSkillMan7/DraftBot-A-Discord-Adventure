/**
 * Allow the bot owner or a badgemanager to remove all badges from somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const resetBadgesCommand = async function (language, message, args) {
	if ((await canPerformCommand(message, language, PERMISSION.ROLE.BADGE_MANAGER)) !== true) {
		return;
	}
	const embed = new discord.MessageEmbed();
	// the author of the command is the author of the bot
	const playerId = message.mentions.users.last().id;
	[entity] = await Entities.getOrRegister(playerId);

	entity.Player.badges = null;
	await entity.Player.save();

	embed.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.resetBadgeCommand.getTranslation(language).resetSuccess, {pseudo: message.author.username}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.resetBadgeCommand.getTranslation(language).descReset, {player: message.mentions.users.last()}));
	return await message.channel.send(embed);
};

module.exports = {
	commands: [
		{
			name: 'rb',
			func: resetBadgesCommand
		}
	]
};

