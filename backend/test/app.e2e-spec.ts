import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { FakeFirebaseTokenValidator } from '../src/auth/__fakes__/fake-firebase-token-validator';
import { FirebaseAdminTokenValidator } from '../src/auth/firebase-admin-token-validator';
import { StorageService } from '../src/storage/storage.service';
import { UserRole } from '../src/users/user-role.enum';

const OWNER_TOKEN = 'owner-token';
const COLLECTOR_TOKEN = 'collector-token';
const OWNER_B_TOKEN = 'owner-b-token';
const UNVERIFIED_TOKEN = 'unverified-token';

const WEBP_FIXTURE = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);
const JPEG_FIXTURE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

interface CreateFields {
  materialType?: string;
  quantityEstimate?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  locationReference?: string;
}

function createRequest(
  app: INestApplication,
  token: string,
  fields: CreateFields = {},
  options: { attachImage?: boolean; image?: Buffer; imageType?: string } = {},
) {
  const merged: CreateFields = {
    materialType: 'ALUMINUM',
    quantityEstimate: 'SMALL',
    latitude: -23.5505,
    longitude: -46.6333,
    ...fields,
  };
  const req = request(app.getHttpServer())
    .post('/requests')
    .set('Authorization', `Bearer ${token}`);
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) {
      req.field(key, String(value));
    }
  }
  if (options.attachImage !== false) {
    req.attach('image', options.image ?? WEBP_FIXTURE, {
      filename: 'fixture.webp',
      contentType: options.imageType ?? 'image/webp',
    });
  }
  return req;
}

describe('Cataí end-to-end', () => {
  let app: INestApplication;
  let fakeValidator: FakeFirebaseTokenValidator;
  let dataSource: DataSource;
  let storage: StorageService;
  let createdRequestId: string;
  let secondRequestId: string;

  beforeAll(async () => {
    fakeValidator = new FakeFirebaseTokenValidator();
    fakeValidator.register(OWNER_TOKEN, {
      uid: 'fb-owner',
      email: 'owner@example.com',
      emailVerified: true,
    });
    fakeValidator.register(COLLECTOR_TOKEN, {
      uid: 'fb-collector',
      email: 'collector@example.com',
      emailVerified: true,
    });
    fakeValidator.register(OWNER_B_TOKEN, {
      uid: 'fb-owner-b',
      email: 'owner-b@example.com',
      emailVerified: true,
    });
    fakeValidator.register(UNVERIFIED_TOKEN, {
      uid: 'fb-unverified',
      email: 'pending@example.com',
      emailVerified: false,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirebaseAdminTokenValidator)
      .useValue(fakeValidator)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);

    storage = app.get(StorageService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
  });

  it('rejects requests with an invalid token', async () => {
    await request(app.getHttpServer()).get('/me').set('Authorization', 'Bearer ghost').expect(401);
  });

  it('creates the internal user on first /me call and lets it pick a role', async () => {
    const meResponse = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(200);

    expect(meResponse.body.email).toBe('owner@example.com');
    expect(meResponse.body.role).toBeNull();
    expect(meResponse.body.firebaseUid).toBeUndefined();

    const updated = await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .send({ name: 'Bar do Zé', role: UserRole.OWNER })
      .expect(200);

    expect(updated.body.role).toBe(UserRole.OWNER);
    expect(updated.body.name).toBe('Bar do Zé');
    expect(updated.body.firebaseUid).toBeUndefined();
  });

  it('rejects role-set when the email is not verified', async () => {
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${UNVERIFIED_TOKEN}`)
      .send({ role: UserRole.OWNER })
      .expect(403);
  });

  it('allows updating the name without a verified email', async () => {
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${UNVERIFIED_TOKEN}`)
      .send({ name: 'Pendente' })
      .expect(200);
  });

  it('locks the role once it is chosen', async () => {
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .send({ role: UserRole.COLLECTOR })
      .expect(409);
  });

  it('rejects POST /requests when the image is missing', async () => {
    await createRequest(app, OWNER_TOKEN, {}, { attachImage: false }).expect(400);
  });

  it('rejects POST /requests with a non-allowed MIME type', async () => {
    await createRequest(
      app,
      OWNER_TOKEN,
      {},
      { image: WEBP_FIXTURE, imageType: 'image/png' },
    ).expect(415);
  });

  it('rejects POST /requests when bytes do not match declared MIME (anti-spoof)', async () => {
    await createRequest(
      app,
      OWNER_TOKEN,
      {},
      { image: JPEG_FIXTURE, imageType: 'image/webp' },
    ).expect(400);
  });

  it('rejects POST /requests with payload over 500 KB (rule §457 #8)', async () => {
    const oversize = Buffer.concat([WEBP_FIXTURE, Buffer.alloc(600 * 1024)]);
    const response = await createRequest(app, OWNER_TOKEN, {}, { image: oversize });
    expect([400, 413]).toContain(response.status);
  });

  it('lets an owner create a collection request with image', async () => {
    const response = await createRequest(app, OWNER_TOKEN, {
      locationReference: 'Retirar nos fundos do bar.',
    }).expect(201);

    expect(response.body.status).toBe('OPEN');
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.image).toBeTruthy();
    expect(response.body.image.imageUrl).toEqual(expect.any(String));
    expect(response.body.image.imageKey).toBeUndefined();
    expect(response.body.createdByUserId).toBeUndefined();
    expect(response.body.reservedByUserId).toBeUndefined();
    createdRequestId = response.body.id;
  });

  it('rejects collectors trying to create requests', async () => {
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${COLLECTOR_TOKEN}`)
      .send({ name: 'Carlos Catador', role: UserRole.COLLECTOR })
      .expect(200);

    await createRequest(app, COLLECTOR_TOKEN, {
      materialType: 'PLASTIC',
      quantityEstimate: 'MEDIUM',
    }).expect(403);
  });

  it('rejects unverified users trying to create requests', async () => {
    await createRequest(app, UNVERIFIED_TOKEN).expect(403);
  });

  it('lists available requests with image included', async () => {
    const response = await request(app.getHttpServer())
      .get('/requests/available')
      .query({ lat: -23.5505, lng: -46.6333, radiusKm: 25 })
      .set('Authorization', `Bearer ${COLLECTOR_TOKEN}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].id).toBe(createdRequestId);
    expect(response.body[0].distanceKm).toBeGreaterThanOrEqual(0);
    expect(response.body[0].createdByUserId).toBeUndefined();
    expect(response.body[0].reservedByUserId).toBeUndefined();
    expect(response.body[0].image?.imageUrl).toEqual(expect.any(String));
  });

  it('rejects POST /requests/:id/image when image already exists', async () => {
    await request(app.getHttpServer())
      .post(`/requests/${createdRequestId}/image`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .attach('image', WEBP_FIXTURE, { filename: 'second.webp', contentType: 'image/webp' })
      .expect(409);
  });

  it('rejects DELETE /requests/:id/image by a foreign owner', async () => {
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${OWNER_B_TOKEN}`)
      .send({ name: 'Outro Dono', role: UserRole.OWNER })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/requests/${createdRequestId}/image`)
      .set('Authorization', `Bearer ${OWNER_B_TOKEN}`)
      .expect(403);
  });

  it('lets the owner DELETE then POST to replace the image', async () => {
    const before = storage.__memorySnapshot();
    const oldKey = before.put[before.put.length - 1];

    await request(app.getHttpServer())
      .delete(`/requests/${createdRequestId}/image`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(204);

    expect(storage.__memorySnapshot().deleted).toContain(oldKey);

    await request(app.getHttpServer())
      .post(`/requests/${createdRequestId}/image`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .attach('image', JPEG_FIXTURE, { filename: 'replacement.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const after = storage.__memorySnapshot();
    expect(after.put.length).toBe(before.put.length + 1);
  });

  it('lets a collector reserve an OPEN request', async () => {
    const response = await request(app.getHttpServer())
      .post(`/requests/${createdRequestId}/reserve`)
      .set('Authorization', `Bearer ${COLLECTOR_TOKEN}`)
      .expect(200);

    expect(response.body.status).toBe('RESERVED');
    expect(response.body.reservedUntil).toEqual(expect.any(String));
    expect(response.body.reservedByUserId).toBeUndefined();
  });

  it('rejects POST /requests/:id/image while RESERVED', async () => {
    await request(app.getHttpServer())
      .delete(`/requests/${createdRequestId}/image`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(409);
  });

  it('prevents a second collector from reserving the same request', async () => {
    fakeValidator.register('second-collector-token', {
      uid: 'fb-collector-2',
      email: 'collector2@example.com',
      emailVerified: true,
    });
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', 'Bearer second-collector-token')
      .send({ name: 'Outro Catador', role: UserRole.COLLECTOR })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/requests/${createdRequestId}/reserve`)
      .set('Authorization', 'Bearer second-collector-token')
      .expect(409);
  });

  it('prevents a non-reserving collector from completing the request', async () => {
    await request(app.getHttpServer())
      .post(`/requests/${createdRequestId}/complete`)
      .set('Authorization', 'Bearer second-collector-token')
      .expect(403);
  });

  it('lets the reserving collector complete the request and deletes the image', async () => {
    const before = storage.__memorySnapshot();
    const keyBeforeComplete = before.put[before.put.length - 1];

    const response = await request(app.getHttpServer())
      .post(`/requests/${createdRequestId}/complete`)
      .set('Authorization', `Bearer ${COLLECTOR_TOKEN}`)
      .expect(200);

    expect(response.body.status).toBe('COMPLETED');
    expect(response.body.completedAt).toEqual(expect.any(String));
    expect(storage.__memorySnapshot().deleted).toContain(keyBeforeComplete);
  });

  it('lets the creator complete a reserved request (§220-222)', async () => {
    const create = await createRequest(app, OWNER_TOKEN, {
      materialType: 'PLASTIC',
      quantityEstimate: 'MEDIUM',
    }).expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${create.body.id}/reserve`)
      .set('Authorization', `Bearer ${COLLECTOR_TOKEN}`)
      .expect(200);

    const completed = await request(app.getHttpServer())
      .post(`/requests/${create.body.id}/complete`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(200);

    expect(completed.body.status).toBe('COMPLETED');
  });

  it('lists my requests for the owner', async () => {
    const response = await request(app.getHttpServer())
      .get('/requests/my')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(200);

    expect(response.body.map((r: { id: string }) => r.id)).toContain(createdRequestId);
  });

  it('lets the creator cancel an OPEN request and deletes the image', async () => {
    const create = await createRequest(app, OWNER_TOKEN, {
      materialType: 'GLASS',
      quantityEstimate: 'LARGE',
    }).expect(201);
    secondRequestId = create.body.id;
    const keyBeforeCancel = storage.__memorySnapshot().put.slice(-1)[0];

    const cancel = await request(app.getHttpServer())
      .post(`/requests/${secondRequestId}/cancel`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(200);

    expect(cancel.body.status).toBe('CANCELLED');
    expect(storage.__memorySnapshot().deleted).toContain(keyBeforeCancel);
  });

  it('rejects cancelling a RESERVED request (§782 critério #10)', async () => {
    const create = await createRequest(app, OWNER_TOKEN, {
      materialType: 'METAL',
      quantityEstimate: 'MEDIUM',
    }).expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${create.body.id}/reserve`)
      .set('Authorization', `Bearer ${COLLECTOR_TOKEN}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/requests/${create.body.id}/cancel`)
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(409);
  });

  it('prevents another owner from cancelling someone else’s request', async () => {
    const create = await createRequest(app, OWNER_TOKEN, {
      materialType: 'METAL',
      quantityEstimate: 'MEDIUM',
    }).expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${create.body.id}/cancel`)
      .set('Authorization', `Bearer ${OWNER_B_TOKEN}`)
      .expect(403);
  });

  it('returns 404 for an unknown request id', async () => {
    await request(app.getHttpServer())
      .get('/requests/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(404);
  });

  it('returns 400 when the request id is not a UUID', async () => {
    await request(app.getHttpServer())
      .get('/requests/not-a-uuid')
      .set('Authorization', `Bearer ${OWNER_TOKEN}`)
      .expect(400);
  });

  it('exposes /health', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.db).toBe('ok');
  });
});
