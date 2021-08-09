const Database = require("../Database");

class ScoreSaberPlayerRepository {
    #scoreSaberDb;
    #players;

    constructor() {
        return (async () => {
            this.#scoreSaberDb = await Database.getScoreSaberDb();
            this.#players = this.#scoreSaberDb.collection("players");

            return this;
        })();
    }

    async findByPlayerId(playerId) {
        return await this.#players.findOne({playerId});
    }

    async findByDiscordId(discordId) {
        return await this.#players.findOne({discordId});
    }

    async findAll() {
        return await this.#players.find().toArray();
    }
}

module.exports = ScoreSaberPlayerRepository;