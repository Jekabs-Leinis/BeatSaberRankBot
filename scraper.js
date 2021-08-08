const scoresaberRegion = require("./config.json").scoresaberRegion;
const numPlayersToScrape = require("./config.json").numPlayersToScrape;
const globalPagesToScrape = require("./config.json").globalPagesToScrape;
const rp = require("request-promise");
const cheerio = require("cheerio");
const Config = require("Config").Config;

class ScoresaberScrapper {
    static PLAYERS_PER_PAGE = 50;
    static HEADERS = {
        "user-agent": `${Config.scoresaberRegion.toUpperCase()} Regional Discord Bot`,
    };



    async getRegionalPlayers() {
        try {
            const pagesToScrape = Math.ceil(Config.numPlayersToScrape / ScoresaberScrapper.PLAYERS_PER_PAGE);
            let players = [];
            for (let i = 0; i < pagesToScrape; i++) {

                const options = {
                    uri:
                        "https://scoresaber.com/global/" +
                        (i + 1) +
                        `&country=${Config.scoresaberRegion}`,
                    headers: ScoresaberScrapper.HEADERS,
                };
                await rp(options)
                    .then((html) => (players.concat(extractPlayers(html, i * ScoresaberScrapper.PLAYERS_PER_PAGE))))
                    .catch((err) => {
                        console.log(err);
                    });
            }
            return players;
        } catch (e) {
            console.log(e);
            throw e;
        }
    },



}



async function extractPlayers(html) {
    const players = [];
    const $ = cheerio.load(html);
    const rows = $("tr");
    rows.each((n) => {
        if (n !== 0) {
            players[n - 1] = new Player({name : $("a", this).attr("href")}) ;
        }
    });

    return players;
}

module.exports = {


    async getTopGlobalPlayers() {
        try {
            const pagesToScrape = globalPagesToScrape;
            let players = [];
            for (let i = 0; i < pagesToScrape; i++) {
                const options = {
                    uri: "https://scoresaber.com/global/" + (i + 1),
                    headers: headers,
                };
                await rp(options)
                    .then((html) => (players = extractPlayers(html, 50 * i)))
                    .catch((err) => {
                        console.log(err);
                    });
            }
            return players;
        } catch (e) {
            console.log(e);
            throw e;
        }
    },

    async getRegion(scoresaber) {
        let region;
        const options = {
            uri: "https://scoresaber.com" + scoresaber,
            headers: headers,
        };
        await rp(options)
            .then((html) => {
                const $ = cheerio.load(html);
                const ul = $("ul", html).slice(0, 1);
                const li = $("li", ul).slice(0, 1);
                const links = $("a", li);
                const regionLink = links.slice(-1).attr("href");
                region = regionLink.slice(-2);
            })
            .catch((err) => {
                console.log(err);
            });
        return region;
    },

    async getPlayerData(scoresaber) {
        let regionRank;
        let region;
        let globalRank;
        let pp;
        let name;
        const options = {
            uri: "https://scoresaber.com" + scoresaber,
            headers: headers,
        };
        await rp(options)
            .then((html) => {
                const $ = cheerio.load(html);
                const ul = $(".columns .column:not(.is-narrow) ul", html)[0];

                const rankingLi = $('strong:contains("Player Ranking:")', ul)
                    .parent()
                    .slice(0, 1);
                const links = $("a", rankingLi);

                const regionLink = links.slice(-1).attr("href");
                region = regionLink.slice(-2);

                const rankingAnchors = $("li:first-child a", ul);
                globalRank = Number(
                    rankingAnchors.slice(0, 1).text().slice(1).replace(",", "")
                );
                regionRank = Number(
                    rankingAnchors.slice(1, 2).text().slice(2).replace(",", "")
                );

                const ppLi = $('strong:contains("Performance Points:")', ul)
                    .parent()
                    .slice(0, 1);

                pp = Number(
                    ppLi
                        .text()
                        .replace("pp", "")
                        .replace(/\s/g, "")
                        .replace("PerformancePoints:", "")
                        .replace(",", "")
                );
                name = $(".title.is-5 a", html).text().trim();
            })
            .catch((err) => {
                console.log(err);
            });
        return [regionRank, region, globalRank, pp, name];
    },

    async getPlayerAtRank(rank, region = false) {
        let pageToScrape = Math.ceil(rank / 50);
        if (rank % 50 === 0) {
            pageToScrape = Math.ceil((rank - 1) / 50);
        }
        let player;
        let url;
        if (!region) {
            url = "https://scoresaber.com/global/" + pageToScrape;
        } else {
            url =
                "https://scoresaber.com/global/" +
                pageToScrape +
                `&country=${region}`;
        }
        const options = {
            uri: url,
            headers: headers,
        };
        await rp(options)
            .then((html) => {
                const $ = cheerio.load(html);
                const rows = $("tr", html);

                let playerRowNum;
                if (rank % 50 === 0) {
                    playerRowNum = 50;
                } else {
                    playerRowNum = rank % 50;
                }

                if (rows.length - 1 < playerRowNum) {
                    player = false;
                    return;
                }

                rows.each(function (n) {
                    if (n === playerRowNum) {
                        player = $("a", this).attr("href");
                    }
                });
            })
            .catch((err) => {
                console.log(err);
            });
        return player;
    },
};
