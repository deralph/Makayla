import { GiftingService } from './gifting.service';
import { BadRequestException } from '@nestjs/common';

describe('GiftingService', () => {
  let service: GiftingService;
  let giftModel: any;
  let userService: any;
  let coinsService: any;
  let giftSaveMock: jest.Mock;

  beforeEach(() => {
    giftSaveMock = jest.fn().mockResolvedValue(undefined);
    const giftConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: 'gift-1',
      save: giftSaveMock,
    }));

    giftModel = Object.assign(giftConstructor, {
      find: jest.fn(),
    });

    userService = {
      findByDeviceId: jest.fn(),
    };
    coinsService = {
      updateCoins: jest.fn(),
    };

    service = new GiftingService(giftModel, userService, coinsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('moves coins between sender and recipient and logs the gift', async () => {
    userService.findByDeviceId.mockImplementation(async (deviceId: string) => {
      if (deviceId === 'sender') {
        return { deviceId, coins: 500, banned: false };
      }
      if (deviceId === 'recipient') {
        return { deviceId, coins: 50, banned: false };
      }
      return null;
    });

    const result = await service.sendGift('sender', {
      recipientDeviceId: 'recipient',
      amount: 100,
      opId: 'gift-op',
    });

    expect(coinsService.updateCoins).toHaveBeenNthCalledWith(
      1,
      'sender',
      expect.objectContaining({
        delta: -100,
        reason: 'gift_send',
        opId: 'gift-op',
      }),
    );
    expect(coinsService.updateCoins).toHaveBeenNthCalledWith(
      2,
      'recipient',
      expect.objectContaining({
        delta: 100,
        reason: 'gift_receive',
        opId: 'gift-op_receive',
      }),
    );

    expect(giftModel).toHaveBeenCalledWith({
      senderDeviceId: 'sender',
      recipientDeviceId: 'recipient',
      amount: 100,
      reason: 'coins',
      status: 'completed',
    });
    expect(giftSaveMock).toHaveBeenCalled();
    expect(result).toEqual({ success: true, giftId: 'gift-1' });
  });

  it('prevents gifting to self', async () => {
    await expect(
      service.sendGift('sender', {
        recipientDeviceId: 'sender',
        amount: 50,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
