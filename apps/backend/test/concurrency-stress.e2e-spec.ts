import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

interface LoginResponseBody {
  data: {
    accessToken: string;
  };
}

describe('Concurrency Stress & Race Condition Test (Zaragoza Scale Proof)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('SIMULTANEOUS UNLOCKS: 8 concurrent pros fighting for 3 slots - exactly 3 succeed, 5 rejected, 0 balance leaks', async () => {
    const passwordHash = await argon2.hash('StressPassword123!');

    // 1. Crear cliente y categoría
    const stressClient = await prisma.user.create({
      data: {
        email: `stress.client.${Date.now()}@yewi.com`,
        passwordHash,
        profile: {
          create: {
            firstName: 'Cliente',
            lastName: 'Stress Zaragoza',
          },
        },
      },
    });

    const category = await prisma.category.findFirst();

    // 2. Crear solicitud con límite estricto de máx 3 desbloqueos
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        clientId: stressClient.id,
        categoryId: category!.id,
        title: 'Reforma de urgencia en Plaza del Pilar Zaragoza',
        description: 'Prueba de estrés concurrente',
        questionnaireAnswers: { urgency: 'Urgente' },
        postalCode: '50001',
        city: 'Zaragoza',
        country: 'ES',
        creditCost: 0,
        maxUnlocks: 3,
        unlocksCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    // 3. Crear 8 profesionales con 50 créditos cada uno y obtener sus tokens JWT
    const proTokens: string[] = [];
    const proIds: string[] = [];

    for (let i = 0; i < 8; i++) {
      const email = `pro.zaragoza.${i}.${Date.now()}@yewi.com`;
      const proUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          isPro: true,
          roles: ['PROFESSIONAL', 'CLIENT'],
          profile: {
            create: {
              firstName: `Pro`,
              lastName: `${i} Zaragoza`,
            },
          },
          professionalProfile: {
            create: {
              businessName: `Empresa Pro ${i} Zaragoza`,
              bio: 'Profesional de prueba',
              city: 'Zaragoza',
              postalCode: '50001',
            },
          },
          wallet: {
            create: {
              creditBalance: 50,
            },
          },
        },
      });

      proIds.push(proUser.id);

      const loginRes = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/api/v1/auth/login')
        .send({ email, password: 'StressPassword123!' });

      const loginBody = loginRes.body as LoginResponseBody;
      proTokens.push(loginBody.data.accessToken);
    }

    // 4. Lanzar 8 peticiones simultáneas en paralelo (Promise.all)
    const unlockPromises = proTokens.map((token) =>
      request(app.getHttpServer() as Parameters<typeof request>[0])
        .post(`/api/v1/leads/requests/${serviceRequest.id}/unlock`)
        .set('Authorization', `Bearer ${token}`),
    );

    const responses = await Promise.all(unlockPromises);

    // 5. Verificar respuestas HTTP
    const successful = responses.filter(
      (r) => r.status === 200 || r.status === 201,
    );
    const rejected = responses.filter((r) => r.status === 400);

    expect(successful.length).toBe(3);
    expect(rejected.length).toBe(5);

    // 6. Verificar integridad en Base de Datos PostgreSQL
    const updatedRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequest.id },
    });
    expect(updatedRequest?.unlocksCount).toBe(3);

    const totalUnlocksInDb = await prisma.leadUnlock.count({
      where: { serviceRequestId: serviceRequest.id },
    });
    expect(totalUnlocksInDb).toBe(3);

    const unlockLedgerEntries = await prisma.ledgerTransaction.count({
      where: {
        referenceId: serviceRequest.id,
        type: 'LEAD_UNLOCK',
      },
    });
    expect(unlockLedgerEntries).toBe(0);

    // 7. Verificar saldos de créditos
    const wallets = await prisma.wallet.findMany({
      where: { userId: { in: proIds } },
    });

    const untouchedWallets = wallets.filter((w) => w.creditBalance === 50);

    expect(untouchedWallets.length).toBe(8);
  });
});
