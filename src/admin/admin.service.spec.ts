import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let userService: any;

  beforeEach(() => {
    userService = {
      findByDeviceId: jest.fn(),
      updateUserState: jest.fn(),
    };

    service = new AdminService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      userService,
      { getTransactions: jest.fn() } as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('persists ban metadata on the user record', async () => {
    userService.findByDeviceId.mockResolvedValue({ deviceId: 'device-1' });
    userService.updateUserState.mockResolvedValue(undefined);

    const until = '2026-01-01T00:00:00.000Z';
    const result = await service.banUser('device-1', {
      reason: 'abuse',
      until,
    });

    expect(userService.updateUserState).toHaveBeenCalledWith(
      'device-1',
      {
        $set: {
          banned: true,
          bannedUntil: new Date(until),
          banReason: 'abuse',
        },
      },
    );

    expect(result).toEqual({
      success: true,
      message: `User device-1 has been banned until ${until}`,
    });
  });

  it('bans permanently when no expiry is provided', async () => {
    userService.findByDeviceId.mockResolvedValue({ deviceId: 'device-2' });

    const result = await service.banUser('device-2', {
      reason: 'fraud',
    });

    expect(userService.updateUserState).toHaveBeenCalledWith(
      'device-2',
      {
        $set: {
          banned: true,
          bannedUntil: null,
          banReason: 'fraud',
        },
      },
    );

    expect(result).toEqual({
      success: true,
      message: 'User device-2 has been banned permanently',
    });
  });
});
