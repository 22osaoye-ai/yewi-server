import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

describe('ProfessionalsService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    professionalProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  } as any;
  const service = new ProfessionalsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the persisted public profile selected by its ID', async () => {
    const persisted = {
      id: 'professional-id',
      businessName: 'Persisted business',
      bio: 'Persisted bio',
      categories: [],
      portfolioItems: [],
      gigs: [],
    };
    prisma.professionalProfile.findFirst.mockResolvedValue(persisted);
    prisma.professionalProfile.findUnique.mockResolvedValue(persisted);

    await expect(service.getPublicProfile('professional-id')).resolves.toEqual({
      ...persisted,
      isPro: false,
    });

    expect(prisma.professionalProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ id: 'professional-id' }, { userId: 'professional-id' }] },
      }),
    );
    const query = prisma.professionalProfile.findFirst.mock.calls[0][0];
    expect(query.select.taxId).toBeUndefined();
    expect(query.select.user.select.profile.select.phoneNumber).toBeUndefined();
  });

  it('returns 404 for a nonexistent public profile', async () => {
    prisma.professionalProfile.findFirst.mockResolvedValue(null);
    prisma.professionalProfile.findUnique.mockResolvedValue(null);


    await expect(service.getPublicProfile('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns persisted nearby professionals without private profile fields', async () => {
    prisma.professionalProfile.findMany.mockResolvedValue([
      {
        id: 'professional-id',
        businessName: 'Persisted business',
        bio: 'Persisted bio',
        serviceRadiusKm: 50,
        latitude: 40.4168,
        longitude: -3.7038,
        user: { profile: null },
        categories: [],
      },
    ]);

    const result = await service.findNearby(40.4168, -3.7038);

    expect(result[0].id).toBe('professional-id');
    const query = prisma.professionalProfile.findMany.mock.calls[0][0];
    expect(query.select.taxId).toBeUndefined();
    expect(query.select.user.select.profile.select.phoneNumber).toBeUndefined();
  });

  it('does not expose another user profile through the authenticated endpoint', async () => {
    prisma.professionalProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.getMyProfile('another-user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.professionalProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'another-user-id' } }),
    );
  });

  it('does not invent required profile data when creating a profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      roles: [],
      professionalProfile: null,
    });

    await expect(service.updateMyProfile('user-id', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.professionalProfile.upsert).not.toHaveBeenCalled();
  });
});
