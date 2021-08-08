const DiscordLogger = require("../Services/DiscordLoggerService");
const scoresaberDb = require("../Database").scoresaber;

class DiscordRepository {
  async getGuildMember(guild, playerId) {
    // Request the discord id of the individual with this Scoresaber profile from the database
    const discordId = await scoresaberDb.get(playerId).catch((err) => {
      console.log(err);
    });

    if (discordId === undefined) {
      DiscordLogger.logError(guild, `User with scoresaber ID ${playerId} has no linked discord account!`);
      return;
    }

    // Get their guildMember object
    return await guild.members
      .fetch(discordId)
      .catch(() => DiscordLogger.logError(guild, `Could not find user <@${discordId}> with id ${discordId}`));
  }
}

module.exports = DiscordRepository;
