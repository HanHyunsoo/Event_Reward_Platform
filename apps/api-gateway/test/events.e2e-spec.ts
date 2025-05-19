import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ApiGatewayModule } from './../src/api-gateway.module';
import {
  ClaimEventRewardResponseDto,
  CreateEventRequestDto,
  CreateEventResponseDto,
} from '@event-reward-platform/protocol';
import { randomInt } from 'crypto';

describe('EventsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('이벤트 보상 수령(POST /events/:id/reward-claims)', () => {
    it('보상 수령 요청을 동시에 여러번 보내면 하나만 처리된다.', async () => {
      // given
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          userId: 'admin',
          password: 'admin',
        })
        .expect(200);

      const adminAccessToken = adminLoginResponse.headers['authorization'];

      const createEventResponse = await request(app.getHttpServer())
        .post('/events')
        .send({
          event: {
            startTime: '2025-05-01T00:00:00.000Z',
            endTime: '2025-12-31T00:00:00.000Z',
            isPublic: true,
            rewards: [
              {
                rewardType: 'item',
                itemInfo: {
                  type: 'weapon',
                  weaponId: 'axe1',
                },
                quantity: 1,
              },
            ],
          },
        } as CreateEventRequestDto)
        .set('Authorization', adminAccessToken)
        .expect(201);

      const eventId = (createEventResponse.body as CreateEventResponseDto).event
        ._id;

      // when
      const randomRequestCount = randomInt(2, 10);

      const rewardClaimPromises = Array.from(
        { length: randomRequestCount },
        async () => {
          const response = await request(app.getHttpServer())
            .post(`/events/${eventId}/reward-claims`)
            .send({})
            .set('Authorization', adminAccessToken);

          return {
            status: response.status,
            body: response.body as ClaimEventRewardResponseDto,
          };
        },
      );

      const rewardClaimResponses = await Promise.all(rewardClaimPromises);

      // then
      expect(
        rewardClaimResponses.filter((it) => it.status === 201).length,
      ).toBe(1);
      expect(
        rewardClaimResponses.filter((it) => it.status === 409).length,
      ).toBe(randomRequestCount - 1);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
