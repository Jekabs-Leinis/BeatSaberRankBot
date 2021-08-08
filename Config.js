const rawConfig = require("./config.json");
const RankGroup = require("./Models/RankGroup");

class Config {
    static prefix = rawConfig.prefix;
    static token = rawConfig.token;
    static staff = rawConfig.staff;
    static serverId = rawConfig.serverId;
    static interval = rawConfig.interval;
    static rankGroups = rawConfig.rankGroups
        .map((g) => new RankGroup(g))
        .sort((x, y) => x.fromRank - y.fromRank);
    static globalRankGroups = rawConfig.globalRankGroups
        .map((g) => new RankGroup(g))
        .sort((x, y) => x.fromRank - y.fromRank);
    static scoresaberRegion = rawConfig.scoresaberRegion;
    static databaseUrl = rawConfig.databaseUrl;
    static databaseName = rawConfig.databaseName;
    static roleMap = new Map(rawConfig.roleMap);
    static errorChannelId = rawConfig.errorChannelId;
    static rankUpdateChannelId = rawConfig.rankUpdateChannelId;
    static numPlayersToScrape = rawConfig.numPlayersToScrape;
    static customRegionName = rawConfig.customRegionName;
}

module.exports = Config;
