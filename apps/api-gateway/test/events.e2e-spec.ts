import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ApiGatewayModule } from './../src/api-gateway.module';
import {
  ClaimEventRewardResponseDto,
  CreateEventRequestDto,
  CreateEventResponseDto,
  CreateOrLoginUserRequestDto,
} from '@event-reward-platform/protocol';
import { randomInt, randomUUID } from 'crypto';

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
    it('유저가 보상 수령 요청을 동시에 여러번 보내면 하나만 처리된다.', async () => {
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

    // TODO: 추후 동시성 이슈 관련 제어 로직 추가 하고 선착순 이벤트 초과 보상 지급이 안되는지 확인(현재는 동시 요청시 한개만 성공하고 나머지는 실패됨 - WriteConflict)
    it.skip('선착순 이벤트의 경우 정해진 수량만큼 보상이 지급되고 나머지 요청은 거부된다.', async () => {
      // given
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          userId: 'admin',
          password: 'admin',
        })
        .expect(200);

      const adminAccessToken = adminLoginResponse.headers['authorization'];

      const randomRewardLimit = randomInt(1, 5);
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
            rewardLimit: randomRewardLimit,
          },
        } as CreateEventRequestDto)
        .set('Authorization', adminAccessToken)
        .expect(201);

      const eventId = (createEventResponse.body as CreateEventResponseDto).event
        ._id;

      const randomRequestCount = randomRewardLimit + randomInt(1, 5);

      const requestAccessTokens = await Promise.all(
        Array.from({ length: randomRequestCount }, async () => {
          const response = await request(app.getHttpServer())
            .post(`/users`)
            .send({
              userId: randomUUID(),
              password: randomUUID(),
            } as CreateOrLoginUserRequestDto)
            .expect(201);

          return response.headers['authorization'];
        }),
      );

      // then
      const rewardClaimPromises = requestAccessTokens.map(
        async (accessToken) => {
          const response = await request(app.getHttpServer())
            .post(`/events/${eventId}/reward-claims`)
            .send({})
            .set('Authorization', accessToken);

          return {
            status: response.status,
            body: response.body as ClaimEventRewardResponseDto,
          };
        },
      );

      const rewardClaimResponses = await Promise.all(rewardClaimPromises);

      expect(
        rewardClaimResponses.filter((it) => it.status === 201).length,
      ).toBe(randomRewardLimit);
      expect(
        rewardClaimResponses.filter((it) => it.status === 410).length,
      ).toBe(randomRequestCount - randomRewardLimit);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
