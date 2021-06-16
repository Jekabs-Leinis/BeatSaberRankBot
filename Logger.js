const errorChannelId = require("./config.json").errorChannelId;

class DiscordLogger {
	static logError(guild, message) {
		console.error(message);

		if (!errorChannelId) {
			return;
		}

		const errorChannel = guild.channels.get(errorChannelId);
		if (!errorChannel) {
			console.error("Invalid error channel id");
			return;
		}

		errorChannel.send(message);
	}
}

module.exports = {
	DiscordLogger
};