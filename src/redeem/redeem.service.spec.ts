import { RedeemService } from './redeem.service';

describe('RedeemService', () => {
  const baseDate = new Date('2025-01-01T00:00:00.000Z');
  let service: RedeemService;
  let redeemCodeModel: any;
  let userService: any;
  let coinsService: any;

  beforeEach(() => {
    jest.useFakeTimers({ now: baseDate });
    redeemCodeModel = function (this: any, data: any) {
      Object.assign(this, data, {
        _id: 'code-1',
        usedBy: [],
        confirmations: [],
        save: jest.fn().mockResolvedValue(undefined),
      });
    } as any;
    redeemCodeModel.findOne = jest.fn();
    redeemCodeModel.find = jest.fn();

    userService = {
      findByDeviceId: jest.fn(),
      updateUserState: jest.fn(),
    };

    coinsService = {
      updateCoins: jest.fn(),
    };

    service = new RedeemService(
      redeemCodeModel,
      userService,
      coinsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('applies rewards and marks the code as used', async () => {
    const deviceId = 'device-1';
    const codeDoc = {
      code: 'BONUS',
      rewards: [
        { type: 'coins', amount: 80 },
        {
          type: 'booster',
          boosterType: 'mega',
          amount: 1,
          durationMinutes: 10,
          multiplier: 2,
        },
        { type: 'energy', amount: 40 },
      ],
      maxUses: 5,
      usedBy: [],
      confirmations: [],
      save: jest.fn().mockResolvedValue(undefined),
    };

    redeemCodeModel.findOne.mockResolvedValue(codeDoc);

    const user = {
      deviceId,
      coins: 100,
      energy: 20,
      energyLimit: 120,
      boosterInventory: {},
    };

    const updatedUserAfterRewards = {
      ...user,
      energy: 60,
      boosterInventory: { mega: 1 },
      activeBoosters: [
        {
          boosterType: 'mega',
          multiplier: 2,
          expiresAt: new Date(baseDate.getTime() + 10 * 60000),
        },
      ],
    };

    const userAfterCoins = {
      ...updatedUserAfterRewards,
      coins: 180,
    };

    userService.findByDeviceId
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(userAfterCoins);

    userService.updateUserState.mockResolvedValue(updatedUserAfterRewards);

    const result = await service.redeemCode(deviceId, { code: 'bonus' });

    expect(userService.updateUserState).toHaveBeenCalledWith(deviceId, {
      $inc: { 'boosterInventory.mega': 1 },
      $set: { energy: 60 },
      $push: {
        activeBoosters: {
          boosterType: 'mega',
          multiplier: 2,
          expiresAt: new Date(baseDate.getTime() + 10 * 60000),
        },
      },
    });

    expect(coinsService.updateCoins).toHaveBeenCalledWith(
      deviceId,
      expect.objectContaining({
        delta: 80,
        reason: 'redeem_code_reward',
        opId: `redeem_${deviceId}_${baseDate.getTime()}`,
      }),
    );

    expect(codeDoc.usedBy).toContain(deviceId);
    expect(codeDoc.save).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      rewards: codeDoc.rewards,
      newBalance: userAfterCoins.coins,
    });
  });

  it('requires admin confirmation when flagged', async () => {
    const codeDoc = {
      code: 'CONFIRM',
      rewards: [],
      maxUses: 1,
      usedBy: [],
      confirmations: [],
      requiresAdminConfirmation: true,
      save: jest.fn(),
    };

    redeemCodeModel.findOne.mockResolvedValue(codeDoc);

    await expect(
      service.redeemCode('device-1', { code: 'confirm' }),
    ).rejects.toThrow('Code requires administrator confirmation');
  });

  it('allows an admin to confirm a code with a gift', async () => {
    const codeDoc = {
      code: 'ADMIN',
      rewards: [{ type: 'coins', amount: 20 }],
      maxUses: 1,
      usedBy: [],
      confirmations: [],
      gift: { amount: 30, reason: 'holiday_gift' },
      requiresAdminConfirmation: true,
      save: jest.fn().mockResolvedValue(undefined),
    };

    redeemCodeModel.findOne.mockResolvedValue(codeDoc);

    const user = {
      deviceId: 'device-2',
      coins: 100,
      energy: 10,
      energyLimit: 100,
      boosterInventory: {},
    };

    const updatedUserAfterGift = { ...user, coins: 130 };
    const updatedUserAfterRewards = { ...updatedUserAfterGift, coins: 150 };

    userService.findByDeviceId
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(updatedUserAfterGift)
      .mockResolvedValueOnce(updatedUserAfterRewards);

    userService.updateUserState.mockResolvedValue(updatedUserAfterGift);

    const result = await service.confirmCode('admin-user', {
      code: 'ADMIN',
      deviceId: 'device-2',
    });

    expect(coinsService.updateCoins).toHaveBeenCalledWith('device-2', {
      delta: 30,
      reason: 'holiday_gift',
      opId: `redeem_gift_device-2_${baseDate.getTime()}`,
    });

    expect(userService.updateUserState).not.toHaveBeenCalled();

    expect(result).toMatchObject({
      success: true,
      confirmedBy: 'admin-user',
      gift: { amount: 30, reason: 'holiday_gift' },
    });
    expect(codeDoc.usedBy).toContain('device-2');
    expect(codeDoc.confirmations).toHaveLength(1);
  });
});
