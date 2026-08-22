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
      update: jest.fn(),
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
});
