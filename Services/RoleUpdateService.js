const Config = require("../Config");
const DiscordLogger = require("./DiscordLoggerService");
const DiscordRepository = require("../Respositories/DiscordRepository");
const scoresaberDb = require("../Database").scoresaber;

class RoleUpdateService {
  // Creates a map of the rank groups and corresponding role objects
  async getRankRoleMap(guild, rankGroups) {
    const rankRoles = new Map();
    const roleNames = rankGroups.map((group) => group.name);

    guild.roles.cache.each((role) => {
      if (roleNames.includes(role.name)) {
        rankRoles.set(role.name, role);
      }
    });

    return rankRoles;
  }

  async createMissingRoles(guild, existingRoles, rankGroups) {
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

  async guildMemberHasRole(guildMember, rankRole) {
    return guildMember.roles.cache.some((userRole) => userRole.id === rankRole.id);
  }

  async clearOtherRankGroups(guildMember, rankGroup, rankRoles) {
    let removedRole;

    rankRoles.forEach((rankRole, rankRoleName) => {
      if (this.guildMemberHasRole(guildMember, rankRole) && rankRoleName !== rankGroup.name) {
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

  async setPlayerRankGroup(guildMember, rankGroup, rankRoles) {
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

  async notifyRankAdvancement(guild, guildMember, removedRole, addedRole, rankGroups) {
    let removedRoleIndex = rankGroups.findIndex((group) => group.name === removedRole.name);
    let addedRoleIndex = rankGroups.findIndex((group) => group.name === addedRole.name);

    if (addedRoleIndex < removedRoleIndex) {
      const rankUpdateChannel = guild.channels.get(Config.rankUpdateChannelId);
      if (rankUpdateChannel) {
        rankUpdateChannel.send(`${guildMember.user.username} has advanced to ${addedRole.name}`);
      }
    }
  }

  async updatePlayerRoles(guild, playerId, playerRank, rankRoles, rankGroups) {
    const discordRepository = new DiscordRepository();
    const guildMember = await discordRepository.getGuildMember(guild, playerId);

    // Work out which rank group they fall under
    let rankGroup = rankGroups.find((group) => group.fromRank >= playerRank);

    let removedRole = await this.clearOtherRankGroups(guildMember, rankGroup, rankRoles);
    // Adds their current rank role if they don't already have it
    let addedRole = await this.setPlayerRankGroup(guildMember, rankGroup, rankRoles);

    if (removedRole && addedRole && Config.rankUpdateChannelId) {
      await this.notifyRankAdvancement(guild, guildMember, removedRole, addedRole, rankGroups);
    }
  }

  async updateAllRoles() {

  }
}

module.exports = RoleUpdateService;
