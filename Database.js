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

    const client = await Database.getClient();
    Database.#scoreSaberDb = client.db(Config.databaseName);

    return Database.#scoreSaberDb;
  }
}

module.exports = Database;
