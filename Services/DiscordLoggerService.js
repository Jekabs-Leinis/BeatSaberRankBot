const Config = require("../Config");

class DiscordLogger {
  static logError(guild, message) {
    console.error(message);

    if (!Config.errorChannelId) {
      return;
    }

    const errorChannel = guild.channels.get(Config.errorChannelId);
    if (!errorChannel) {
      console.error("Invalid error channel id");
      return;
    }

    errorChannel.send(message);
  }
}

module.exports = DiscordLogger;
