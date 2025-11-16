import { MissionsService } from './missions.service';
import { BadRequestException } from '@nestjs/common';

const createExecResult = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

describe('MissionsService', () => {
  const baseDate = new Date('2025-01-01T00:00:00.000Z');
  let service: MissionsService;
  let missionModel: any;
  let userService: any;
  let coinsService: any;

  beforeEach(() => {
    jest.useFakeTimers({ now: baseDate });
    missionModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };
    userService = {
      findByDeviceId: jest.fn(),
      updateUserState: jest.fn(),
    };
    coinsService = {
      updateCoins: jest.fn(),
    };

    service = new MissionsService(
      missionModel,
      userService,
      coinsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('grants configured social mission rewards after completion', async () => {
    const deviceId = 'device-123';
    const missionId = 'mission-1';
    const user = {
      deviceId,
      coins: 200,
      energy: 40,
      energyLimit: 120,
      boosterInventory: {},
      activeBoosters: [],
      missions: {
        daily: [],
        social: {
          telegramJoined: true,
          xFollowed: false,
          postShared: false,
          rewardsClaimed: {},
        },
      },
    };

    const updatedUserAfterRewards = {
      ...user,
      energy: 90,
      boosterInventory: { mega: 3 },
      activeBoosters: [
        {
          boosterType: 'mega',
          multiplier: 3,
          expiresAt: new Date(baseDate.getTime() + 15 * 60000),
        },
      ],
    };

    const userAfterCoins = {
      ...updatedUserAfterRewards,
      coins: 260,
    };

    userService.findByDeviceId
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(userAfterCoins);

    userService.updateUserState
      .mockResolvedValueOnce(updatedUserAfterRewards)
      .mockResolvedValueOnce(null);

    coinsService.updateCoins.mockResolvedValue(undefined);

    const mission = {
      _id: { toString: () => missionId },
      type: 'social',
      reward: 0,
      rewards: [
        { type: 'coins', amount: 60 },
        {
          type: 'booster',
          boosterType: 'mega',
          amount: 3,
          durationMinutes: 15,
          multiplier: 3,
        },
        { type: 'energy', amount: 50 },
      ],
      meta: { platform: 'telegram' },
    };

    missionModel.findById.mockReturnValue(createExecResult(mission));

    const result = await service.claimMission(deviceId, {
      missionId,
      opId: 'mission-op',
    });

    expect(userService.updateUserState).toHaveBeenNthCalledWith(
      1,
      deviceId,
      {
        $inc: { 'boosterInventory.mega': 3 },
        $set: { energy: 90 },
        $push: {
          activeBoosters: {
            boosterType: 'mega',
            multiplier: 3,
            expiresAt: new Date(baseDate.getTime() + 15 * 60000),
          },
        },
      },
    );

    expect(coinsService.updateCoins).toHaveBeenCalledWith(
      deviceId,
      expect.objectContaining({
        delta: 60,
        reason: 'mission_social_reward',
        opId: 'mission-op',
      }),
    );

    expect(userService.updateUserState).toHaveBeenNthCalledWith(
      2,
      deviceId,
      expect.objectContaining({
        $set: expect.objectContaining({
          'missions.social.rewardsClaimed': expect.objectContaining({
            [missionId]: true,
          }),
        }),
      }),
    );

    expect(result).toEqual({
      success: true,
      rewards: mission.rewards,
      newBalance: userAfterCoins.coins,
      missionState: 'completed',
    });
  });

  it('rejects reward claim if requirements are not met', async () => {
    const deviceId = 'device-123';
    const missionId = 'mission-2';
    const user = {
      deviceId,
      coins: 100,
      energy: 30,
      energyLimit: 100,
      missions: {
        daily: [],
        social: {
          telegramJoined: false,
          xFollowed: false,
          postShared: false,
          rewardsClaimed: {},
        },
      },
    };

    userService.findByDeviceId.mockResolvedValue(user);

    const mission = {
      _id: { toString: () => missionId },
      type: 'social',
      reward: 50,
      rewards: [],
      meta: { platform: 'telegram' },
    };

    missionModel.findById.mockReturnValue(createExecResult(mission));

    await expect(
      service.claimMission(deviceId, { missionId, opId: 'mission-op' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
