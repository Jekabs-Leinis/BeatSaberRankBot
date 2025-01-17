const _assign = require("lodash/assign");

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
    _assign(this, props);
  }
}

module.exports = ScoreSaberPlayer;
