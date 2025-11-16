import { TournamentsService } from './tournaments.service';

const createTournamentDoc = (overrides: Record<string, any> = {}) => ({
  _id: 'tournament-1',
  title: 'Test Tournament',
  description: 'A friendly match',
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  endDate: new Date('2025-01-02T00:00:00.000Z'),
  entryFee: 10,
  rewards: {},
  status: 'running',
  maxParticipants: 10,
  leaderboard: [],
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('TournamentsService', () => {
  let service: TournamentsService;
  let tournamentModel: any;
  let userService: any;
  let coinsService: any;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2025-01-01T12:00:00.000Z') });
    tournamentModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };
    userService = {
      findByDeviceId: jest.fn(),
    };
    coinsService = {
      updateCoins: jest.fn(),
    };

    service = new TournamentsService(
      tournamentModel,
      userService,
      coinsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('charges entry and registers the player on join', async () => {
    const tournamentDoc = createTournamentDoc();
    tournamentModel.findById.mockResolvedValue(tournamentDoc);

    userService.findByDeviceId.mockResolvedValue({
      deviceId: 'device-1',
      banned: false,
      coins: 100,
    });

    const result = await service.joinTournament('device-1', 'tournament-1', {
      opId: 'join-op',
    });

    expect(result).toEqual({ success: true });
    expect(tournamentDoc.leaderboard).toHaveLength(1);
    expect(tournamentDoc.leaderboard[0]).toMatchObject({
      deviceId: 'device-1',
      coinsGenerated: 0,
    });

    expect(coinsService.updateCoins).toHaveBeenCalledWith(
      'device-1',
      expect.objectContaining({
        delta: -tournamentDoc.entryFee,
        reason: 'tournament_entry',
      }),
    );
    expect(tournamentDoc.save).toHaveBeenCalled();
  });

  it('updates leaderboard scores when a better result is submitted', async () => {
    const tournamentDoc = createTournamentDoc({
      leaderboard: [
        {
          deviceId: 'device-1',
          coinsGenerated: 15,
          joinedAt: new Date('2025-01-01T11:00:00.000Z'),
        },
      ],
    });
    tournamentModel.findById.mockResolvedValue(tournamentDoc);

    const response = await service.submitScore('device-1', 'tournament-1', {
      coinsGenerated: 30,
    });

    expect(response).toEqual({ success: true, coinsGenerated: 30 });
    expect(tournamentDoc.leaderboard[0].coinsGenerated).toBe(30);
    expect(tournamentDoc.save).toHaveBeenCalled();
  });

  it('prevents more than 10 participants from joining', async () => {
    const tournamentDoc = createTournamentDoc({
      leaderboard: Array.from({ length: 10 }).map((_, idx) => ({
        deviceId: `device-${idx}`,
        coinsGenerated: 5,
        joinedAt: new Date('2025-01-01T11:00:00.000Z'),
      })),
    });
    tournamentModel.findById.mockResolvedValue(tournamentDoc);

    userService.findByDeviceId.mockResolvedValue({
      deviceId: 'overflow',
      banned: false,
    });

    await expect(
      service.joinTournament('overflow', 'tournament-1', {} as any),
    ).rejects.toThrow('Tournament is full');
  });
});
