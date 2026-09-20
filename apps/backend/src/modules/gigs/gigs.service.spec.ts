import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GigStatus, PackageTier, UserRole } from '@prisma/client';
import { GigsService } from './gigs.service';

describe('GigsService', () => {
  let service: GigsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      professionalProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      gig: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      gigPackage: {
        create: jest.fn(),
      },
      gigExtra: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };
    service = new GigsService(prisma);
  });

  describe('create', () => {
    it('should create a gig resolving category by name when category is not a UUID', async () => {
      const userId = 'user-1';
      prisma.professionalProfile.findUnique.mockResolvedValue({
        id: 'pro-1',
        userId,
      });

      // Category resolution
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-uuid-1234',
        name: 'Electricidad',
        slug: 'electricidad',
      });

      prisma.gig.findUnique.mockResolvedValue(null); // slug is unique
      prisma.gig.create.mockResolvedValue({
        id: 'gig-1',
        title: 'Servicio de Electricidad 24h',
        categoryId: 'cat-uuid-1234',
        professionalProfileId: 'pro-1',
      });

      const result = await service.create(userId, {
        title: 'Servicio de Electricidad 24h',
        category: 'Electricidad',
        categoryId: 'Electricidad', // String name passed as categoryId
        price: 120,
        deliveryDays: 3,
        description: 'Instalación eléctrica completa',
        city: 'Zaragoza',
      });

      expect(prisma.gig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: 'cat-uuid-1234', // Safely resolved to the real UUID!
            professionalProfileId: 'pro-1',
            status: GigStatus.ACTIVE,
          }),
        }),
      );
      expect(prisma.gigPackage.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should auto-provision professionalProfile and assign PROFESSIONAL role if user does not have one', async () => {
      const userId = 'user-new';
      prisma.professionalProfile.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        roles: [UserRole.CLIENT],
        profile: {
          displayName: 'Juan Electricista',
          city: 'Zaragoza',
          postalCode: '50001',
        },
      });
      prisma.professionalProfile.create.mockResolvedValue({
        id: 'pro-auto-1',
        userId,
      });
      prisma.user.update.mockResolvedValue({});

      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-uuid-5678',
        name: 'Fontanería',
        slug: 'fontaneria',
      });
      prisma.gig.findUnique.mockResolvedValue(null);
      prisma.gig.create.mockResolvedValue({
        id: 'gig-2',
        title: 'Reparación de Fontanería',
        categoryId: 'cat-uuid-5678',
        professionalProfileId: 'pro-auto-1',
      });

      await service.create(userId, {
        title: 'Reparación de Fontanería',
        category: 'Fontanería',
        price: 80,
        deliveryDays: 2,
        description: 'Reparación de fugas y tuberías',
      });

      expect(prisma.professionalProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            businessName: 'Juan Electricista',
          }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            roles: expect.objectContaining({
              set: expect.arrayContaining([UserRole.PROFESSIONAL]),
            }),
          }),
        }),
      );
    });

    it('should create gig with 3 packages (Básico, Completo, Premium VIP) and features', async () => {
      const userId = 'pro-user-id';
      prisma.professionalProfile.findUnique.mockResolvedValue({
        id: 'pro-profile-id',
        userId,
      });
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-uuid-999',
        name: 'Reformas',
        slug: 'reformas',
      });
      prisma.gig.findUnique.mockResolvedValue(null);
      prisma.gig.create.mockResolvedValue({
        id: 'gig-3-packages',
        title: 'Reforma Integral de Vivienda',
        categoryId: 'cat-uuid-999',
        professionalProfileId: 'pro-profile-id',
      });

      const packages = [
        {
          tier: PackageTier.BASIC,
          name: 'Básico',
          description: 'Mano de obra y diagnóstico inicial',
          price: 195,
          deliveryDays: 2,
          revisions: 1,
          features: ['Mano de obra', 'Diagnóstico inicial'],
        },
        {
          tier: PackageTier.STANDARD,
          name: 'Completo',
          description: 'Servicio integral con materiales',
          price: 300,
          deliveryDays: 4,
          revisions: 2,
          isPopular: true,
          features: ['Todo en Básico', 'Materiales estándar'],
        },
        {
          tier: PackageTier.PREMIUM,
          name: 'Premium VIP',
          description: 'Solución llave en mano con máxima prioridad',
          price: 480,
          deliveryDays: 7,
          revisions: 99,
          features: ['Todo en Completo', 'Prioridad absoluta', 'Garantía 12 meses'],
        },
      ];

      await service.create(userId, {
        title: 'Reforma Integral de Vivienda',
        category: 'Reformas',
        description: 'Reforma con acabados de primera calidad',
        price: 300,
        deliveryDays: 4,
        packages,
      });

      expect(prisma.gigPackage.create).toHaveBeenCalledTimes(3);
      expect(prisma.gigPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tier: PackageTier.BASIC,
            price: 195,
            deliveryDays: 2,
          }),
        }),
      );
      expect(prisma.gigPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tier: PackageTier.STANDARD,
            price: 300,
            isPopular: true,
          }),
        }),
      );
      expect(prisma.gigPackage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tier: PackageTier.PREMIUM,
            price: 480,
            deliveryDays: 7,
          }),
        }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      const userId = 'user-slug';
      prisma.professionalProfile.findUnique.mockResolvedValue({
        id: 'pro-slug',
        userId,
      });
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-uuid' });
      prisma.gig.findUnique.mockResolvedValue({ id: 'existing-gig' }); // slug exists

      await expect(
        service.create(userId, {
          title: 'Servicio Duplicado',
          slug: 'slug-duplicado',
          description: 'Descripción válida',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findBySlug', () => {
    it('should return gig detail with packages and reviews', async () => {
      const mockGig = {
        id: 'gig-123',
        slug: 'servicio-reforma-123',
        title: 'Servicio Reforma',
        packages: [{ id: 'pkg-1', name: 'Básico' }],
        professionalProfile: { id: 'pro-1' },
      };
      prisma.gig.findFirst.mockResolvedValue(mockGig);

      const result = await service.findBySlug('servicio-reforma-123');
      expect(result).toEqual(mockGig);
    });

    it('should throw NotFoundException if gig does not exist', async () => {
      prisma.gig.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
