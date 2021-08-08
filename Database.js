const Keyv = require("keyv");
const Config = require("./Config")

const scoresaberDb = new Keyv(Config.database, { namespace: "scoresaber" });
scoresaberDb.on("error", (err) => console.error("Keyv connection error:", err));

module.exports = {
	scoresaber: scoresaberDb
};