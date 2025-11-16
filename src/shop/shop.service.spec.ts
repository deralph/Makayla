import { ShopService } from './shop.service';

const createExecResult = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

describe('ShopService', () => {
  const baseDate = new Date('2025-01-01T00:00:00.000Z');
  let service: ShopService;
  let itemModel: any;
  let boosterModel: any;
  let userService: any;
  let coinsService: any;

  beforeEach(() => {
    jest.useFakeTimers({ now: baseDate });
    itemModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };
    boosterModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };
    userService = {
      findByDeviceId: jest.fn(),
      updateUserState: jest.fn(),
    };
    coinsService = {
      updateCoins: jest.fn(),
    };

    service = new ShopService(
      itemModel,
      boosterModel,
      userService,
      coinsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('applies booster purchases and returns the refreshed player state', async () => {
    const deviceId = 'device-1';
    const purchaseOpId = 'purchase-123';
    const user = {
      deviceId,
      coins: 500,
      energy: 40,
      energyLimit: 100,
      boosterInventory: {},
    };
    const updatedUserAfterUpdate = {
      ...user,
      energy: 100,
      boosterInventory: { mega: 2 },
      activeBoosters: [
        {
          boosterType: 'mega',
          multiplier: 2,
          expiresAt: new Date(baseDate.getTime() + 30 * 60000),
        },
      ],
    };
    const userAfterBonus = {
      ...updatedUserAfterUpdate,
      coins: 500,
    };

    userService.findByDeviceId
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(userAfterBonus);
    userService.updateUserState.mockResolvedValue(updatedUserAfterUpdate);

    const boosterItem = {
      _id: 'item-1',
      cost: 25,
      type: 'booster',
      active: true,
      meta: {
        boosterType: 'mega',
        quantity: 2,
        instantCoins: 25,
        restoreEnergy: true,
        durationMinutes: 30,
        multiplier: 2,
      },
    };

    itemModel.findById.mockReturnValue(createExecResult(null));
    boosterModel.findById.mockReturnValue(createExecResult(boosterItem));

    const result = await service.purchaseItem(deviceId, {
      itemId: boosterItem._id,
      opId: purchaseOpId,
    });

    expect(coinsService.updateCoins).toHaveBeenNthCalledWith(
      1,
      deviceId,
      expect.objectContaining({
        delta: -boosterItem.cost,
        reason: 'purchase_booster',
        opId: purchaseOpId,
      }),
    );

    expect(userService.updateUserState).toHaveBeenCalledWith(deviceId, {
      $inc: { 'boosterInventory.mega': 2 },
      $set: { energy: 100 },
      $push: {
        activeBoosters: {
          boosterType: 'mega',
          multiplier: 2,
          expiresAt: new Date(baseDate.getTime() + 30 * 60000),
        },
      },
    });

    expect(coinsService.updateCoins).toHaveBeenNthCalledWith(
      2,
      deviceId,
      expect.objectContaining({
        delta: 25,
        reason: 'purchase_bonus_booster',
        opId: `${purchaseOpId}_bonus`,
      }),
    );

    expect(result).toEqual({
      success: true,
      newBalance: userAfterBonus.coins,
      itemState: userAfterBonus,
    });
  });
});
