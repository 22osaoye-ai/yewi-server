import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface ApiResponseBody<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: any;
}

describe('Yewi Marketplace API (E2E Integration Tests)', () => {
  let app: INestApplication;
  let clientToken: string;
  let proToken: string;
  let adminToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication Flow', () => {
    it('POST /api/v1/auth/login - should authenticate client', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'laura.cliente@ejemplo.com',
          password: 'Password123!#',
        })
        .expect(200);

      const body = response.body as ApiResponseBody<{ accessToken: string }>;
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      clientToken = body.data.accessToken;
    });

    it('POST /api/v1/auth/login - should authenticate professional', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'carlos.fontanero@ejemplo.com',
          password: 'Password123!#',
        })
        .expect(200);

      const body = response.body as ApiResponseBody<{
        accessToken: string;
        user: { professionalProfile: any };
      }>;
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.user.professionalProfile).toBeDefined();
      proToken = body.data.accessToken;
    });

    it('POST /api/v1/auth/login - should authenticate admin', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@yewi.com',
          password: 'AdminPassword123!#',
        })
        .expect(200);

      const body = response.body as ApiResponseBody<{ accessToken: string }>;
      expect(body.success).toBe(true);
      adminToken = body.data.accessToken;
    });
  });

  describe('2. Categories & Cuestionarios Dinámicos', () => {
    it('GET /api/v1/categories/tree - should return hierarchical categories', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/categories/tree')
        .expect(200);

      const body = response.body as ApiResponseBody<
        Array<{ slug: string; subcategories: any[] }>
      >;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      const hogar = body.data.find((c) => c.slug === 'hogar-reformas');
      expect(hogar).toBeDefined();
      expect(hogar?.subcategories.length).toBeGreaterThan(0);
    });
  });

  describe('3. Fiverr Style Gigs & Packages', () => {
    it('GET /api/v1/gigs - should list published gigs with packages and filters', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/gigs')
        .expect(200);

      const body = response.body as ApiResponseBody<
        Array<{ id: string; packages: any[] }>
      >;
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      const firstGig = body.data[0];
      expect(firstGig.packages).toBeDefined();
      expect(firstGig.packages.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/gigs/:slug - should return full gig details', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/gigs/diseno-logotipo-moderno-minimalista-marca')
        .expect(200);

      const body = response.body as ApiResponseBody<{
        title: string;
        packages: any[];
      }>;
      expect(body.success).toBe(true);
      expect(body.data.title).toContain('logotipo');
      expect(body.data.packages.length).toBe(3);
    });
  });

  describe('4. ProntoPro Style Leads & Matching', () => {
    it('GET /api/v1/professionals/nearby - should calculate distances for Madrid coordinates', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/professionals/nearby?lat=40.4168&lon=-3.7038')
        .expect(200);

      const body = response.body as ApiResponseBody<
        Array<{ businessName?: string; distanceKm: number }>
      >;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      const carlos = body.data.find(
        (p) => p.businessName && p.businessName.includes('Mendoza'),
      );
      expect(carlos).toBeDefined();
      expect(carlos?.distanceKm).toBeLessThan(10);
    });

    it('GET /api/v1/leads/opportunities - pro should list opportunities with masked data', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/leads/opportunities')
        .set('Authorization', `Bearer ${proToken}`)
        .expect(200);

      const body = response.body as ApiResponseBody<
        Array<{ creditCost: number; client: { email: string } }>
      >;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      if (body.data.length > 0) {
        const lead = body.data[0];
        expect(lead.creditCost).toBeGreaterThan(0);
        expect(lead.client.email).toContain('***@***.com');
      }
    });
  });

  describe('5. Wallet & Credits', () => {
    it('GET /api/v1/wallet/packages - should return available credit packs', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/wallet/packages')
        .expect(200);

      const body = response.body as ApiResponseBody<any[]>;
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(4);
    });

    it('GET /api/v1/wallet/me - should return pro wallet balance', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/wallet/me')
        .set('Authorization', `Bearer ${proToken}`)
        .expect(200);

      const body = response.body as ApiResponseBody<{ creditBalance: number }>;
      expect(body.success).toBe(true);
      expect(body.data.creditBalance).toBeGreaterThanOrEqual(50);
    });
  });

  describe('6. Admin Dashboard & Governance', () => {
    it('GET /api/v1/admin/dashboard/stats - admin should access platform analytics', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ApiResponseBody<{
        overview: { totalUsers: number; totalActiveGigs: number };
      }>;
      expect(body.success).toBe(true);
      expect(body.data.overview.totalUsers).toBeGreaterThanOrEqual(6);
      expect(body.data.overview.totalActiveGigs).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/v1/admin/dashboard/stats - non-admin should be forbidden (403)', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('7. Health & Monitoring (Terminus)', () => {
    it('GET /api/v1/health - should report PostgreSQL, Redis and Memory status as UP', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1/health')
        .expect(200);

      const body = response.body as ApiResponseBody<{
        status: string;
        info: {
          database_postgres: { status: string };
          redis: { status: string };
        };
      }>;
      expect(body.data.status).toBe('ok');
      expect(body.data.info.database_postgres.status).toBe('up');
      expect(body.data.info.redis.status).toBe('up');
    });
  });
});
