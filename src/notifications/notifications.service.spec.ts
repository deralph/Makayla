import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let pushTokenModel: any;
  let notificationModel: any;
  let notificationSaveMock: jest.Mock;
  let findChain: any;

  beforeEach(() => {
    pushTokenModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(undefined),
    };

    notificationSaveMock = jest.fn().mockResolvedValue(undefined);
    const notificationConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: 'notification-1',
      save: notificationSaveMock,
    }));

    const notifications = [
      {
        _id: 'notification-1',
        title: 'Hello',
        body: 'World',
        targetDeviceIds: [],
        status: 'pending',
      },
    ];

    const limitMock = jest.fn().mockResolvedValue(notifications);
    const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
    findChain = {
      sort: sortMock,
    };

    notificationModel = Object.assign(notificationConstructor, {
      find: jest.fn().mockReturnValue(findChain),
      updateMany: jest.fn().mockResolvedValue(undefined),
    });

    service = new NotificationsService(pushTokenModel, notificationModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers tokens with upsert semantics', async () => {
    await service.registerToken('device-1', {
      token: 'abc',
      platform: 'ios',
    });

    expect(pushTokenModel.findOneAndUpdate).toHaveBeenCalledWith(
      { deviceId: 'device-1', token: 'abc' },
      expect.objectContaining({
        $set: expect.objectContaining({ platform: 'ios' }),
      }),
      { upsert: true, new: true },
    );
  });

  it('queues notifications and returns their identifier', async () => {
    const result = await service.sendNotification({
      title: 'Hello',
      body: 'World',
      deviceIds: ['device-1'],
    });

    expect(notificationModel).toHaveBeenCalledWith({
      title: 'Hello',
      body: 'World',
      targetDeviceIds: ['device-1'],
      status: 'pending',
    });
    expect(notificationSaveMock).toHaveBeenCalled();
    expect(result).toEqual({ success: true, notificationId: 'notification-1' });
  });

  it('delivers queued notifications and marks them as sent', async () => {
    const response = await service.pullNotifications('device-1');

    expect(notificationModel.find).toHaveBeenCalled();
    expect(notificationModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['notification-1'] } },
      expect.objectContaining({
        $addToSet: { deliveredTo: 'device-1' },
        $set: { status: 'sent' },
      }),
    );

    expect(response).toEqual({
      notifications: [
        {
          id: 'notification-1',
          title: 'Hello',
          body: 'World',
        },
      ],
    });
  });
});
