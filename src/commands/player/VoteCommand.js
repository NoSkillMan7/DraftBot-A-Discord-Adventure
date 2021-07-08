/**
 * Displays the changelog of the bot
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function VoteCommand(language, message, args) {
    const voteEmbed = new discord.MessageEmbed()
        .setDescription(JsonReader.commands.vote.getTranslation(language).text)
        .setTitle(JsonReader.commands.vote.getTranslation(language).title)
        .setColor(JsonReader.bot.embed.default);
    message.channel.send(voteEmbed);
}

module.exports = {
    commands: [
        {
            name: 'vote',
            func: VoteCommand,
            aliases: ['votes','ilovedraftbot']
        }
    ]
};