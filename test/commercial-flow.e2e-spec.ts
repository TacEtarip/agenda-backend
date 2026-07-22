import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { ClientStage } from '@domain/enums/client-stage.enum';
import { ProductType } from '@domain/enums/product-type.enum';
import { ClientProductStatus } from '@domain/enums/client-product-status.enum';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import { PaymentMethod } from '@domain/enums/payment-method.enum';
import { PaymentStatus } from '@domain/enums/payment-status.enum';
import { PaymentOrigin } from '@domain/enums/payment-origin.enum';
import type { INestApplication } from '@nestjs/common';

describe('Commercial flow (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const runId = randomUUID();
  const email = `e2e-${runId}@agenda.test`;
  const password = 'AgendaE2E-2026';
  const companyName = `Agenda E2E ${runId}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await removeTestCompany();
    }
    await app?.close();
  });

  it('registers, logs in, creates a client, product, sale and payment', async () => {
    const server = app.getHttpServer();

    const registerResponse = await request(server)
      .post('/auth/register-company')
      .send({
        email,
        firstName: 'Usuario',
        lastName: 'E2E',
        phone: '+51987654321',
        password,
        companyName,
        yapeEnabled: true,
        yapePhone: '987654321',
        yapeAccountName: 'Agenda E2E',
      })
      .expect(201);

    expect(registerResponse.body).toEqual({
      accessToken: expect.any(String),
    });

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;
    expect(accessToken).toEqual(expect.any(String));

    const profileResponse = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body).toEqual(
      expect.objectContaining({
        userId: expect.any(String),
        email,
        companyId: expect.any(String),
        companyName,
      }),
    );

    const yapeConfigurationResponse = await request(server)
      .get('/payments/configuration/yape')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(yapeConfigurationResponse.body).toEqual({
      enabled: true,
      phone: '987654321',
      accountName: 'Agenda E2E',
    });

    const googleStatusResponse = await request(server)
      .get('/integrations/google/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(googleStatusResponse.body).toEqual({
      configured: expect.any(Boolean),
      connected: false,
      scopes: [],
    });

    const clientResponse = await request(server)
      .post('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Cliente',
        lastName: 'E2E',
        phoneNumber: '+51911111111',
        email: `cliente-${runId}@agenda.test`,
        stage: ClientStage.FOLLOW_UP,
      })
      .expect(201);

    const client = clientResponse.body.client as {
      id: string;
      companyId: string;
      stage: ClientStage;
    };
    expect(client).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        companyId: profileResponse.body.companyId,
        stage: ClientStage.FOLLOW_UP,
      }),
    );

    const appointmentStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    appointmentStart.setUTCSeconds(0, 0);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + 60 * 60 * 1000,
    );
    const appointmentResponse = await request(server)
      .post('/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId: client.id,
        title: 'Cita E2E',
        startTime: appointmentStart.toISOString(),
        endTime: appointmentEnd.toISOString(),
      })
      .expect(201);

    expect(appointmentResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        clientId: client.id,
      }),
    );

    const conflictingStart = new Date(
      appointmentStart.getTime() + 30 * 60 * 1000,
    );
    const conflictingEnd = new Date(appointmentEnd.getTime() + 30 * 60 * 1000);
    const availabilityResponse = await request(server)
      .post('/appointments/availability')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime: conflictingStart.toISOString(),
        endTime: conflictingEnd.toISOString(),
      })
      .expect(200);

    expect(availabilityResponse.body).toEqual(
      expect.objectContaining({
        available: false,
        externalCalendarChecked: false,
        conflicts: [
          expect.objectContaining({
            source: 'agenda',
            appointmentId: appointmentResponse.body.id,
          }),
        ],
      }),
    );

    const adjacentAvailabilityResponse = await request(server)
      .post('/appointments/availability')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime: appointmentEnd.toISOString(),
        endTime: new Date(
          appointmentEnd.getTime() + 60 * 60 * 1000,
        ).toISOString(),
      })
      .expect(200);

    expect(adjacentAvailabilityResponse.body).toEqual({
      available: true,
      externalCalendarChecked: false,
      conflicts: [],
    });

    const conflictCreationResponse = await request(server)
      .post('/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId: client.id,
        title: 'Cita E2E superpuesta',
        startTime: conflictingStart.toISOString(),
        endTime: conflictingEnd.toISOString(),
      })
      .expect(409);

    expect(conflictCreationResponse.body).toEqual(
      expect.objectContaining({ code: 'APPOINTMENT_TIME_CONFLICT' }),
    );

    await dataSource.query(
      `INSERT INTO appointment_schedule_conflicts
        (appointment_id, user_id, source, external_event_id, conflict_start_time, conflict_end_time)
       VALUES ($1, $2, 'google', $3, $4, $5)`,
      [
        appointmentResponse.body.id,
        profileResponse.body.userId,
        'personal-google-event-e2e',
        appointmentStart,
        appointmentEnd,
      ],
    );

    const appointmentsWithConflictResponse = await request(server)
      .get(`/appointments/client/${client.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(appointmentsWithConflictResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: appointmentResponse.body.id,
          scheduleConflicts: [
            expect.objectContaining({
              source: 'google',
              conflictStartTime: appointmentStart.toISOString(),
              conflictEndTime: appointmentEnd.toISOString(),
            }),
          ],
        }),
      ]),
    );

    const rescheduledStart = new Date(
      appointmentEnd.getTime() + 60 * 60 * 1000,
    );
    const rescheduledEnd = new Date(
      rescheduledStart.getTime() + 60 * 60 * 1000,
    );
    await request(server)
      .put(`/appointments/${appointmentResponse.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime: rescheduledStart.toISOString(),
        endTime: rescheduledEnd.toISOString(),
      })
      .expect(200);

    const activeConflicts = await dataSource.query<Array<{ id: string }>>(
      `SELECT id FROM appointment_schedule_conflicts
       WHERE appointment_id = $1 AND resolved_at IS NULL`,
      [appointmentResponse.body.id],
    );
    expect(activeConflicts).toHaveLength(0);

    const productResponse = await request(server)
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: ProductType.PRODUCT,
        name: 'Producto E2E',
        description: 'Producto creado por el flujo comercial E2E',
        price: 150,
      })
      .expect(201);

    const product = productResponse.body as {
      id: string;
      price: number;
      type: ProductType;
    };
    expect(product).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        price: 150,
        type: ProductType.PRODUCT,
      }),
    );

    const customPrice = 125.5;
    const quantity = 3;
    const saleResponse = await request(server)
      .post('/client-products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId: client.id,
        productId: product.id,
        status: ClientProductStatus.SOLD,
        notes: 'Venta creada por el flujo E2E',
        customPrice,
        quantity,
      })
      .expect(201);

    const sale = saleResponse.body as {
      id: string;
      clientId: string;
      productId: string;
      status: ClientProductStatus;
      customPrice: number;
      quantity: number;
    };
    expect(sale).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        clientId: client.id,
        productId: product.id,
        status: ClientProductStatus.SOLD,
        customPrice,
        quantity,
      }),
    );

    const amount = customPrice * quantity;
    const paidAt = new Date().toISOString();
    const paymentResponse = await request(server)
      .post('/payments/manual')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sourceType: PaymentSourceType.CLIENT_PRODUCT,
        sourceId: sale.id,
        amount,
        method: PaymentMethod.YAPE,
        paidAt,
        reference: `E2E-${runId}`,
      })
      .expect(201);

    const payment = paymentResponse.body as {
      id: string;
      amount: number;
      status: PaymentStatus;
      origin: PaymentOrigin;
      method: PaymentMethod;
      clientProductId: string;
      sourceType: PaymentSourceType;
      sourceId: string;
    };
    expect(payment).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        amount,
        status: PaymentStatus.PAID,
        origin: PaymentOrigin.MANUAL,
        method: PaymentMethod.YAPE,
        clientProductId: sale.id,
        sourceType: PaymentSourceType.CLIENT_PRODUCT,
        sourceId: sale.id,
      }),
    );

    const historyResponse = await request(server)
      .get(`/payments/source/${PaymentSourceType.CLIENT_PRODUCT}/${sale.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(historyResponse.body).toEqual([
      expect.objectContaining({
        id: payment.id,
        amount,
        status: PaymentStatus.PAID,
      }),
    ]);
  });

  async function removeTestCompany(): Promise<void> {
    const userRows = (await dataSource.query(
      'SELECT "company_id" FROM "users" WHERE "email" = $1',
      [email],
    )) as Array<{ company_id: string | null }>;
    const companyRows = (await dataSource.query(
      'SELECT "id" FROM "companies" WHERE "name" = $1',
      [companyName],
    )) as Array<{ id: string }>;
    const companyId = userRows[0]?.company_id ?? companyRows[0]?.id;

    if (!companyId) return;

    await dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM "payments" WHERE "company_id" = $1', [
        companyId,
      ]);
      await manager.query(
        'DELETE FROM "client_products" WHERE "client_id" IN (SELECT "id" FROM "clients" WHERE "company_id" = $1) OR "product_id" IN (SELECT "id" FROM "products" WHERE "company_id" = $1)',
        [companyId],
      );
      await manager.query('DELETE FROM "clients" WHERE "company_id" = $1', [
        companyId,
      ]);
      await manager.query('DELETE FROM "products" WHERE "company_id" = $1', [
        companyId,
      ]);
      await manager.query('DELETE FROM "users" WHERE "company_id" = $1', [
        companyId,
      ]);
      await manager.query('DELETE FROM "companies" WHERE "id" = $1', [
        companyId,
      ]);
    });
  }
});
