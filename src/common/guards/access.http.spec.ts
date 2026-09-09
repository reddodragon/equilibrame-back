import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AdminAccessController } from '../../modules/auth/admin-access.controller';
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';
import { UsersService } from '../../modules/users/users.service';
import { AdminCategoriesController } from '../../modules/categories/admin-categories.controller';
import { CategoriesController } from '../../modules/categories/categories.controller';
import { CategoriesService } from '../../modules/categories/categories.service';
import { AdminProductsController } from '../../modules/products/admin-products.controller';
import { ProductsService } from '../../modules/products/products.service';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';

// Real HTTP, JWT validation and authorization; only persistence is simulated.
describe('administrative HTTP authorization', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const users = new Map<
    string,
    { id: string; role: string; isActive: boolean }
  >();
  const secret = 'isolated-http-test-signing-key-not-for-deployment';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret })],
      controllers: [
        AdminAccessController,
        AdminCategoriesController,
        CategoriesController,
        AdminProductsController,
      ],
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: () => secret } },
        {
          provide: UsersService,
          useValue: {
            findPublicById: (id: string) => Promise.resolve(users.get(id)),
          },
        },
        {
          provide: CategoriesService,
          useValue: { findAll: () => [], findAllAdmin: () => [] },
        },
        { provide: ProductsService, useValue: { findAllAdmin: () => [] } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new JwtAuthGuard(reflector),
      new RolesGuard(reflector),
      new PermissionsGuard(reflector),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    jwt = app.get(JwtService);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => users.clear());

  function token(role: string, claimRole = role) {
    const id = 'test-user';
    users.set(id, { id, role, isActive: true });
    return jwt.sign({ sub: id, role: claimRole }, { expiresIn: '5m' });
  }

  it('keeps catalog categories public', async () => {
    await request(app.getHttpServer()).get('/api/categories').expect(200);
  });

  it.each([
    '/api/admin/access',
    '/api/admin/categories',
    '/api/admin/products',
  ])('rejects anonymous access to %s', async (path) => {
    await request(app.getHttpServer()).get(path).expect(401);
  });

  it.each(['USER', 'EMPLOYEE', 'ENTREPRENEUR'])(
    'rejects %s even with an ADMIN claim in a valid JWT',
    async (role) => {
      const bearer = token(role, 'ADMIN');
      for (const path of [
        '/api/admin/access',
        '/api/admin/categories',
        '/api/admin/products',
      ]) {
        await request(app.getHttpServer())
          .get(path)
          .auth(bearer, { type: 'bearer' })
          .expect(403);
      }
    },
  );

  it('returns effective permissions to the active administrator', async () => {
    const bearer = token('ADMIN');
    const response = await request(app.getHttpServer())
      .get('/api/admin/access')
      .auth(bearer, { type: 'bearer' })
      .expect(200);
    const body = response.body as {
      success: boolean;
      data: { role: string; permissions: string[] };
    };
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('ADMIN');
    expect(body.data.permissions).toEqual(
      expect.arrayContaining(['admin:access', 'catalog:manage']),
    );
    for (const path of ['/api/admin/categories', '/api/admin/products']) {
      await request(app.getHttpServer())
        .get(path)
        .auth(bearer, { type: 'bearer' })
        .expect(200);
    }
  });

  it('applies role changes without waiting for the existing token to expire', async () => {
    const bearer = token('ADMIN');
    users.set('test-user', { id: 'test-user', role: 'USER', isActive: true });
    await request(app.getHttpServer())
      .get('/api/admin/access')
      .auth(bearer, { type: 'bearer' })
      .expect(403);
  });

  it('rejects inactive accounts even with a valid administrator token', async () => {
    const bearer = token('ADMIN');
    users.set('test-user', { id: 'test-user', role: 'ADMIN', isActive: false });
    await request(app.getHttpServer())
      .get('/api/admin/access')
      .auth(bearer, { type: 'bearer' })
      .expect(401);
  });
});
