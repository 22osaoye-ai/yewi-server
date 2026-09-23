import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      findFirst: jest.fn(),
    },
    professionalProfile: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwt = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test_secret_1234567890';
      if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret_1234567890';
      if (key === 'JWT_EXPIRATION') return '15m';
      if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ConflictException if registering with existing email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing_user_id' });

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw UnauthorizedException if login password is wrong', async () => {
    const hashed = await argon2.hash('CorrectPassword123!');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'test@example.com',
      passwordHash: hashed,
      isActive: true,
      roles: [UserRole.CLIENT],
    });

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  describe('checkAvailability', () => {
    it('should return available: false if email already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

      const res = await service.checkAvailability({ email: 'test@example.com' });
      expect(res.email).toBeDefined();
      expect(res.email?.available).toBe(false);
      expect(res.email?.message).toBe('Correo ya registrado');
    });

    it('should return available: true if email does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const res = await service.checkAvailability({ email: 'free@example.com' });
      expect(res.email).toBeDefined();
      expect(res.email?.available).toBe(true);
      expect(res.email?.message).toBe('Disponible');
    });

    it('should return available: false if phone is registered in Spain', async () => {
      mockPrisma.profile.findFirst.mockResolvedValue({ id: 'p1', phoneNumber: '+34600112233' });

      const res = await service.checkAvailability({
        country: 'España',
        phoneNumber: '+34600112233',
      });
      expect(res.phoneNumber).toBeDefined();
      expect(res.phoneNumber?.available).toBe(false);
      expect(res.phoneNumber?.message).toBe('Teléfono ya registrado');
    });

    it('should return available: false if taxId is registered', async () => {
      mockPrisma.professionalProfile.findFirst.mockResolvedValue({ id: 'pro1', taxId: '12345678Z' });

      const res = await service.checkAvailability({ taxId: '12345678Z' });
      expect(res.taxId).toBeDefined();
      expect(res.taxId?.available).toBe(false);
      expect(res.taxId?.message).toBe('NIF/CIF ya registrado');
    });
  });
});
