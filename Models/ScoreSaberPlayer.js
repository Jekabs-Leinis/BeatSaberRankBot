const _ = require("lodash")

class ScoreSaberPlayer {
    playerId;
    playerName;
    avatar;
    rank;
    countryRank;
    pp;
    country;
    role;
    badges;
    history;
    permissions;
    inactive;
    banned;

    constructor(props = {}) {
        _.assign(this, props);
    }
}

module.exports = ScoreSaberPlayer