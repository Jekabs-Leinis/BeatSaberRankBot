const Keyv = require("keyv");
const Config = require("./Config");
const { MongoClient } = require("mongodb");

class Database {
  static #client;
  static #scoreSaberDb;

  static async getClient() {
    if (Database.#client) {
      return Database.#client;
    }

    Database.#client = new MongoClient(Config.databaseUrl);
    try {
      await Database.#client.connect();
    } catch (error) {
      console.error(error);

      throw error;
    }

    console.log("Connected successfully to database");

    return Database.#client;
  }

  static async getScoreSaberDb() {
    if (Database.#scoreSaberDb) {
      return Database.#scoreSaberDb;
    }

    const client = Database.getClient();
    Database.#scoreSaberDb = client.db(Config.databaseName);

    return Database.#scoreSaberDb;
  }
}

const scoresaberDb = new Keyv(Config.databaseUrl, { namespace: "scoresaber" });
scoresaberDb.on("error", (err) => console.error("Keyv connection error:", err));

module.exports = {
  scoresaber: scoresaberDb,
};
