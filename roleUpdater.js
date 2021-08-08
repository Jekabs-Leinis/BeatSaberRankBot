const discordLogger = require("./Logger").DiscordLogger;
const rankGroups = require("./config.json").rankGroups;
const globalRankGroups = require("./config.json").globalRankGroups;
const roleMap = require("./config.json").roleMap;
const scoresaberRegion = require("./config.json").scoresaberRegion;
const errorChannelId = require("./config.json").errorChannelId;
const scraper = require("./scraper.js");
const scoresaberDb = require("./Database").scoresaber;
const Config = require("./Config").Config;

require("events").EventEmitter.defaultMaxListeners = 100;

// Creates a map of the rank groups and corresponding role objects
function getRankRoleMap(guild, rankGroups) {
  const rankRoles = new Map();
  const roleNames = rankGroups.map((group) => group.name);

  guild.roles.cache.each((role) => {
    if (roleNames.includes(role.name)) {
      rankRoles.set(role.name, role);
    }
  });

  return rankRoles;
}

function createMissingRoles(guild, existingRoles, rankGroups) {
  const missingRoles = rankGroups.filter((group) => !existingRoles.has(group.name));

  for (const roleGroup of missingRoles) {
    guild.roles
      .create({
        data: {
          name: roleGroup.name,
          position: 1, //TODO: Put the role in the correct position
          hoist: true,
          mentionable: false,
        },
      })
      .then(() => console.log(`Created Role ${roleGroup.name}`));
  }
}

function guildMemberHasRole(guildMember, rankRole) {
  return guildMember.roles.cache.some((userRole) => userRole.id === rankRole.id);
}

function clearOtherRankGroups(guildMember, rankGroup, rankRoles) {
  let removedRole;
  rankRoles.forEach((rankRole, rankRoleName) => {
    if (guildMemberHasRole(guildMember, rankRole) && rankRoleName !== rankGroup.name) {
      try {
        guildMember.roles.remove(rankRole);
        removedRole = rankRole;
        console.log(`Removed role from ${guildMember.user.tag}: ${rankRoleName}`);
      } catch (err) {
        console.log(err);
      }
    }
  });

  return removedRole;
}

async function setPlayerRankGroup(guildMember, rankGroup, rankRoles) {
  let addedRole;
  if (!guildMember.roles.cache.some((role) => role.name === rankGroup) && rankGroup !== "") {
    try {
      await guildMember.roles.add(rankRoles[rankGroup]);
      addedRole = rankRoles[rankGroup];
      console.log(`Added role to ${guildMember.user.tag}: ${rankRoles[rankGroup].name}`);
    } catch (err) {
      console.log(err);
    }
  }

  return addedRole;
}

function notifyRankAdvancement(guild, guildMember, removedRole, addedRole, rankGroups) {
  let removedRoleIndex = rankGroups.findIndex((group) => group.name === removedRole.name);
  let addedRoleIndex = rankGroups.findIndex((group) => group.name === addedRole.name);

  if (addedRoleIndex < removedRoleIndex) {
    const rankUpdateChannel = guild.channels.get(Config.rankUpdateChannelId);
    if (rankUpdateChannel) {
      rankUpdateChannel.send(`${guildMember.user.username} has advanced to ${addedRole.name}`);
    }
  }
}

async function updatePlayerRoles(playerId, playerRank, guild, rankRoles, rankGroups) {
  // Request the discord id of the individual with this Scoresaber profile from the database
  const discordId = await scoresaberDb.get(playerId).catch((err) => {
    console.log(err);
  });

  if (discordId === undefined) return;

  // Get their guildMember object
  const guildMember = await guild.members
    .fetch(discordId)
    .catch(() => discordLogger.logError(guild, `Could not find user <@${discordId}> with id ${discordId}`));

  if (guildMember === undefined) return;

  // Work out which rank group they fall under
  let rankGroup = rankGroups.find((group) => group.fromRank >= playerRank);

  let removedRole = clearOtherRankGroups(guildMember, rankGroup, rankRoles);
  // Adds their current rank role if they don't already have it
  let addedRole = await setPlayerRankGroup(guildMember, rankGroup, rankRoles);

  if (removedRole && addedRole && Config.rankUpdateChannelId) {
    notifyRankAdvancement(guild, guildMember, removedRole, addedRole, rankGroups);
  }
}

async function updateRoles(playerIds, guild, rankGroups) {
  let rankRoles = getRankRoleMap(guild, rankGroups);

  if (rankRoles.size !== rankGroups.length) {
    createMissingRoles(guild, rankRoles);
    rankRoles = getRankRoleMap(guild, rankGroups);
  }

  for (let i = 0; i < playerIds.length; i++) {
    await updatePlayerRoles(playerIds[i], i + 1, guild, rankRoles, rankGroups);
  }
}

module.exports = {
  async autoUpdateRoles(guild) {
    console.log("Running automatic role update.");
    const players = scoresaberDb.
    const players = await scraper.getPlayers().catch((err) => {
      console.log(err);
    });
    updateRoles(players, guild).then(() => {
      console.log("Automatic role update complete.");
    });
    return players;
  },

  async updateRegionRoles(playerIds, guild) {
    console.log("Updating region rank roles");
    await updateRoles(playerIds, guild, Config.rankGroups);
    console.log("Finished updating region rank roles");
  },

  async updateGlobalRoles(playerIds, guild) {
    console.log("Updating global rank roles");
    await updateRoles(playerIds, guild, Config.globalRankGroups);
    console.log("Finished updating global rank roles");
  },

  async updateGlobalRoles(guild) {
    console.log("Updating global rank roles");
    // Create a dictionary of the global rank groups and corresponding role objects
    const globalRankRoles = {};
    const guildRoles = guild.roles.cache;
    for (const rolePair of guildRoles) {
      const role = rolePair[1];
      for (let p = 0; p < globalRankGroups.length; p++) {
        if (role.name === globalRankGroups[p][0]) {
          globalRankRoles[globalRankGroups[p][0]] = role;
        }
      }
    }

    const players = await scraper.getTopGlobalPlayers();

    for (let i = 0; i < players.length; i++) {
      const scoresaber = players[i];
      const rank = i + 1;

      // Request the discord id of the individual with this Scoresaber profile from the database
      const discordId = await scoresaberDb.get(scoresaber).catch((err) => {
        console.log(err);
      });
      if (discordId === undefined) continue;

      // Get their guildMember object
      const guildMember = await guild.member.fetch(discordId).catch(() => {
        if (errorChannelId !== "" && errorChannelId !== undefined) {
          const errorChannel = guild.channels.get(errorChannelId);
          if (errorChannel !== undefined) {
            errorChannel.send(`Could not find user <@${discordId}> with id ${discordId}`);
          }
        }
        console.log(`Could not find user <@${discordId}> with id ${discordId}`);
      });
      if (guildMember === undefined) continue;

      // Work out which rank group they fall under
      let rankGroup = "";
      for (let n = 0; n < globalRankGroups.length; n++) {
        if (rank <= globalRankGroups[n][1]) {
          rankGroup = globalRankGroups[n][0];
          break;
        }
      }

      // Removes rank roles they shouldn't have
      for (const [rankRoleName, rankRole] of Object.entries(globalRankRoles)) {
        if (guildMember.roles.cache.some((role) => role === rankRole) && rankRole.name !== rankGroup) {
          try {
            await guildMember.roles.remove(rankRole.name);
            console.log(`Removed role from ${guildMember.user.tag}: ${rankRoleName}`);
          } catch (err) {
            console.log(err);
          }
        }
      }

      // Adds their current rank role if they don't already have it
      if (!guildMember.roles.cache.some((role) => role.name === rankGroup) && rankGroup !== "") {
        try {
          await guildMember.roles.add(globalRankRoles[rankGroup]);
          console.log(`Added role to ${guildMember.user.tag}: ${globalRankRoles[rankGroup].name}`);
        } catch (err) {
          console.log(err);
        }
      }
    }
    console.log("Finished updating global rank roles");
  },

  async addRegionRole(scoresaber, guildMember) {
    const region = await scraper.getRegion(scoresaber);
    let i = -1;
    for (let n = 0; n < roleMap.length; n++) {
      if (roleMap[n][0] === region) {
        i = n;
      }
    }
    if (i === -1) {
      i = roleMap.length - 1;
    }
    const regionalRoleName = roleMap[i][1];

    // Adds their region role if they don't already have it
    if (!guildMember.roles.cache.some((role) => role.name === regionalRoleName)) {
      try {
        let regionalRole;
        const guildRoles = guildMember.guild.roles.cache;
        for (const rolePair of guildRoles) {
          const role = rolePair[1];
          if (role.name === regionalRoleName) {
            regionalRole = role;
          }
        }

        if (regionalRole == null) {
          console.log(`Error adding role to ${guildMember.user.tag}`);
          return;
        }

        await guildMember.roles.add(regionalRole);
        console.log(`Added role to ${guildMember.user.tag}: ${regionalRole.name}`);
      } catch (err) {
        console.log(err);
      }
    }
  },

  async addRankRole(scoresaber, guildMember) {
    // Check they're in the region
    const region = await scraper.getRegion(scoresaber);
    let i = -1;
    for (let n = 0; n < roleMap.length; n++) {
      if (roleMap[n][0] === region) {
        i = n;
      }
    }
    if (i === -1) return;

    if (scoresaberRegion.length !== 2) {
      module.exports.autoUpdateRoles(guildMember.guild);
      return;
    }

    // Create a dictionary of the rank groups and corresponding role objects
    const rankRoles = {};
    const guildRoles = guildMember.guild.roles.cache;
    for (const rolePair of guildRoles) {
      const role = rolePair[1];
      for (let p = 0; p < rankGroups.length; p++) {
        if (role.name === rankGroups[p][0]) {
          rankRoles[rankGroups[p][0]] = role;
        }
      }
    }

    const playerData = await scraper.getPlayerData(scoresaber);
    const rank = playerData[0];

    // Work out which rank group they fall under
    let rankGroup = "";
    for (let n = 0; n < rankGroups.length; n++) {
      if (rank <= rankGroups[n][1]) {
        rankGroup = rankGroups[n][0];
        break;
      }
    }

    if (rankGroup === "") return;

    // Removes rank roles they shouldn't have
    for (const [rankRoleName, rankRole] of Object.entries(rankRoles)) {
      if (guildMember.roles.cache.some((role) => role === rankRole) && rankRole.name !== rankGroup) {
        try {
          await guildMember.roles.remove(rankRole);
          console.log(`Removed role from ${guildMember.user.tag}: ${rankRoleName}`);
        } catch (err) {
          console.log(err);
        }
      }
    }

    // Adds their current rank role if they don't already have it
    if (!guildMember.roles.cache.some((role) => role.name === rankGroup) && rankGroup !== "") {
      try {
        await guildMember.roles.add(rankRoles[rankGroup]);
        console.log(`Added role to ${guildMember.user.tag}: ${rankRoles[rankGroup].name}`);
      } catch (err) {
        console.log(err);
      }
    }
  },
};
