const _assign = require("lodash/assign");

class ScoreSaberPlayer {
  playerId;
  discordId;

  constructor(props = {}) {
    _assign(this, props);
  }
}

module.exports = ScoreSaberPlayer;
