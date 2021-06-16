const rawConfig = require("./config.json");

class RankGroup {
    constructor(arr) {
        this.name = arr[0];
        this.fromRank = arr[1];
    }
}

class Config {
    static prefix = rawConfig.prefix;
    static token = rawConfig.token;
    static staff = rawConfig.staff;
    static serverId = rawConfig.serverId;
    static interval = rawConfig.interval;
    static rankGroups = rawConfig.rankGroups.map((g) => new RankGroup(g));
    static globalRankGroups = rawConfig.globalRankGroups.map((g) => new RankGroup(g));
    static scoresaberRegion = rawConfig.scoresaberRegion;
    static database = rawConfig.database;
    static roleMap = new Map(rawConfig.roleMap);
    static errorChannelId = rawConfig.errorChannelId;
    static rankUpdateChannelId = rawConfig.rankUpdateChannelId;
    static numPlayersToScrape = rawConfig.numPlayersToScrape;
    static customRegionName = rawConfig.customRegionName;
}

module.exports = {
    Config,
    RankGroup,
};
