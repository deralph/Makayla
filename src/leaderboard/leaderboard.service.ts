import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SubmitScoreDto } from './dto/submit-score.dto';

@Injectable()
export class LeaderboardService {
  constructor(private readonly userService: UserService) {}

  async getGlobalLeaderboard(limit: number = 50) {
    const users = await this.userService.getTopUsers(limit);
    
    return {
      topPlayers: users.map((user, index) => ({
        rank: index + 1,
        name: user.deviceId,
        points: user.rankPoints, // Use rankPoints for ranking
      })),
      prizeWinners: this.generatePrizeTable(users.slice(0, 10)),
    };
  }

  async getFriendsLeaderboard(deviceId: string) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get friends' device IDs
    const friendIds = user.friends.map(f => f.friendId);
    
    // Get friends' data
    const friends = await this.userService.getUsersByIds(friendIds);
    
    // Sort by rank points (highest to lowest)
    const sortedFriends = friends.sort((a, b) => b.rankPoints - a.rankPoints);
    
    // Find current user's rank among all users
    const allUsers = await this.userService.getTopUsers(1000);
    const userRank = allUsers.findIndex(u => u.deviceId === deviceId) + 1;

    return {
      friendsRank: sortedFriends.map((friend, index) => ({
        rank: index + 1,
        name: friend.deviceId,
        points: friend.rankPoints,
      })),
      yourRank: userRank,
    };
  }

  async submitScore(deviceId: string, submitScoreDto: SubmitScoreDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user's score - use rankPoints for leaderboard ranking
    await this.userService.updateUserState(deviceId, {
      rankPoints: user.rankPoints + submitScoreDto.value,
    });

    // Get new rank by fetching all users sorted by rankPoints
    const allUsers = await this.userService.getTopUsers(1000);
    const newRank = allUsers.findIndex(u => u.deviceId === deviceId) + 1;

    return {
      success: true,
      newRank,
    };
  }

  private generatePrizeTable(topUsers: any[]) {
    const prizes = [100, 98, 96, 94, 92, 90, 88, 86, 84, 82];
    
    return topUsers.map((user, index) => ({
      rank: index + 1,
      prize: prizes[index] || 80,
    }));
  }
}