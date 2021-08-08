const axios = require("axios");
const ScoreSaberPlayer = require("../Models/ScoreSaberPlayer");

class ScoreSaberApiService {
  static BASE_URL = "https://new.scoresaber.com/api";

  async getBasicPlayerData(scoresaberId) {
    try {
      const response = await axios.get(`${ScoreSaberApiService.BASE_URL}/player/${scoresaberId}/basic`);

      return new ScoreSaberPlayer(response);
    } catch (error) {
      console.error(error);
    }
  }
}
