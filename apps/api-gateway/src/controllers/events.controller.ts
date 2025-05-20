import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ClaimEventRewardResponseDto,
  ClaimEventRewardsRequestDto,
  ClaimHistoryFilter,
  CreateEventRequestDto,
  CreateEventResponseDto,
  EVENT_PATTERNS,
  EventDto,
  FindAllEventRequestDto,
  FindAllEventResponseDto,
  FindOneEventResponseDto,
  GetClaimHistoriesRequestDto,
  GetClaimHistoriesResponseDto,
  GetEventRewardsResponse,
  Role,
  UpdateEventRewardsRequestDto,
  UpdateEventRewardsResponseDto,
} from '@event-reward-platform/protocol';
import { Request } from 'express';
import {
  AccessTokenPayload,
  ParseObjectIdPipe,
} from '@event-reward-platform/core';
import { JwtGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../decorators/roles.decorator';
import { Types } from 'mongoose';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiConflictResponse,
  ApiGoneResponse,
} from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

@Controller('events')
export class EventsController {
  constructor(
    @Inject('EVENTS_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Event-Service 서버의 상태를 확인합니다.',
  })
  @ApiOkResponse({ description: 'OK' })
  async healthCheck(): Promise<string> {
    return await firstValueFrom(
      this.eventClient.send(EVENT_PATTERNS.HEALTH_CHECK, ''),
    );
  }

  @Post()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({
    summary: '이벤트 생성',
    description: '이벤트를 생성합니다.',
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: '이벤트 생성 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  @ApiForbiddenResponse({
    description: '해당 작업에 대한 권한 없음(ADMIN/OPERATOR 권한 필요)',
  })
  async createEvent(
    @Req() req: Request,
    @Body() createEventRequestDto: CreateEventRequestDto,
  ): Promise<CreateEventResponseDto> {
    const { event } = createEventRequestDto;
    const eventWithCreatorId = {
      ...event,
      creatorId: (req.user as AccessTokenPayload).userId,
    };

    return await firstValueFrom<CreateEventResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.CREATE_EVENT, {
        event: eventWithCreatorId,
      } as CreateEventRequestDto),
    );
  }

  private canAccessEvent(event: EventDto | undefined, role: Role): boolean {
    const isEventExist = event != null;

    if (!isEventExist) {
      return false;
    }

    if (event.isPublic) {
      return true;
    }

    return [Role.ADMIN, Role.OPERATOR].includes(role);
  }

  // 아래 'events/:id'와 겹칠 수 있어 우선순위를 더 높임
  @Get('reward-claims')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '이벤트 보상 지급 내역 조회',
    description:
      '이벤트 보상 지급 내역을 조회합니다(updatedAt 내림차순 정렬). 유저의 권한에 따라 보이는 내역이 다릅니다.\n\n' +
      '- ADMIN/OPERATOR/AUDITOR 권한의 경우 모든 이벤트 보상 지급 내역을 조회할 수 있습니다.\n' +
      '- USER 권한의 경우 자신의 이벤트 보상 지급 내역만 조회할 수 있습니다.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 보상 지급 내역 조회 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  async getClaimHistories(
    @Query() query: GetClaimHistoriesRequestDto,
    @Req() req: Request,
  ): Promise<GetClaimHistoriesResponseDto> {
    const user = req.user as AccessTokenPayload;

    const filter = [Role.ADMIN, Role.OPERATOR, Role.AUDITOR].includes(user.role)
      ? ClaimHistoryFilter.ALL
      : ClaimHistoryFilter.USER_ID;

    return await firstValueFrom<GetClaimHistoriesResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.GET_CLAIM_HISTORIES, {
        filter,
        userId:
          filter === ClaimHistoryFilter.USER_ID && user.userId
            ? user.userId
            : undefined,
        timeAt: query.timeAt,
        limit: query.limit,
      } as GetClaimHistoriesRequestDto),
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '이벤트 조회',
    description:
      '특정 이벤트를 조회합니다. 미공개 이벤트의 경우 ADMIN/OPERATOR 권한만 볼 수 있습니다.',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID(ObjectId)',
    example: '6694902b254b2569ad704db2',
    type: String,
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 조회 성공' })
  @ApiBadRequestResponse({ description: '유효하지 않은 이벤트 ID' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  async getEventById(
    @Req() req: Request,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<FindOneEventResponseDto> {
    const resBody = await firstValueFrom<FindOneEventResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.GET_EVENT_BY_ID, id.toString()),
    );

    const requestUserRole = (req.user as AccessTokenPayload).role;

    if (!this.canAccessEvent(resBody?.event, requestUserRole)) {
      return {};
    }

    if ([Role.USER, Role.AUDITOR].includes(requestUserRole)) {
      if (resBody.event != null) {
        resBody.event.creatorId = undefined;
      }
    }

    return resBody;
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '이벤트 목록 조회',
    description:
      '이벤트 목록을 조회합니다. 미공개 이벤트의 경우 ADMIN/OPERATOR 권한만 볼 수 있습니다.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 목록 조회 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  async getEvents(
    @Req() req: Request,
    @Query() query: FindAllEventRequestDto,
  ): Promise<FindAllEventResponseDto> {
    const requestUserRole = (req.user as AccessTokenPayload).role;
    const isUserOrAuditor = [Role.USER, Role.AUDITOR].includes(requestUserRole);

    if (isUserOrAuditor) {
      query.isPublic = true;
    }

    const resBody = await firstValueFrom<FindAllEventResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.GET_EVENTS, query),
    );

    return {
      events: resBody.events
        .filter((event) => {
          return this.canAccessEvent(event, requestUserRole);
        })
        .map((event) => {
          if (isUserOrAuditor) {
            event.creatorId = undefined;
          }

          return event;
        }),
    };
  }

  @Get(':id/rewards')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '이벤트 보상 조회',
    description: '이벤트 보상을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID(ObjectId)',
    example: '6694902b254b2569ad704db2',
    type: String,
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 보상 조회 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  async getEventRewards(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<GetEventRewardsResponse> {
    return await firstValueFrom<GetEventRewardsResponse>(
      this.eventClient.send(EVENT_PATTERNS.GET_REWARDS, id.toString()),
    );
  }

  @Put(':id/rewards')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({
    summary: '이벤트 보상 수정',
    description: '이벤트 보상을 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID(ObjectId)',
    example: '6694902b254b2569ad704db2',
    type: String,
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 보상 수정 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  @ApiForbiddenResponse({
    description: '해당 작업에 대한 권한 없음(ADMIN/OPERATOR 권한 필요)',
  })
  async updateEventRewards(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateEventRewardsRequestDto: UpdateEventRewardsRequestDto,
  ): Promise<UpdateEventRewardsResponseDto> {
    return await firstValueFrom<UpdateEventRewardsResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.UPDATE_REWARDS, {
        eventId: id.toString(),
        rewards: updateEventRewardsRequestDto.rewards,
      } as UpdateEventRewardsRequestDto),
    );
  }

  @Post(':id/reward-claims')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '이벤트 보상 지급 요청',
    description: '이벤트 조건 달성 시 해당 보상을 지급받습니다.',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID(ObjectId)',
    example: '6694902b254b2569ad704db2',
    type: String,
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 보상 지급 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  @ApiForbiddenResponse({
    description: '이벤트 도전 과제 미충족 or 종료됨',
  })
  @ApiConflictResponse({
    description: '이벤트 보상 지급 실패(중복 수령, 선착순 마감, 중복 요청)',
  })
  @ApiGoneResponse({
    description: '선착순 마감으로 인한 보상 지급 실패',
  })
  async claimEventRewards(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: Request,
  ): Promise<ClaimEventRewardResponseDto> {
    return await firstValueFrom<ClaimEventRewardResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.CLAIM_REWARD, {
        eventId: id.toString(),
        userId: (req.user as AccessTokenPayload).userId,
      } as ClaimEventRewardsRequestDto),
    );
  }

  @Get(':id/reward-claims')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: '특정 이벤트 보상 지급 내역 조회',
    description:
      '특정 이벤트 보상 지급 내역을 조회합니다(updatedAt 내림차순 정렬). 유저의 권한에 따라 보이는 내역이 다릅니다.\n\n' +
      '- ADMIN/OPERATOR/AUDITOR 권한의 경우 모든 이벤트 보상 지급 내역을 조회할 수 있습니다.\n' +
      '- USER 권한의 경우 자신의 이벤트 보상 지급 내역만 조회할 수 있습니다.',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID(ObjectId)',
    example: '6694902b254b2569ad704db2',
    type: String,
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '이벤트 보상 지급 내역 조회 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 인증 토큰' })
  async getClaimHistoriesByEvent(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: GetClaimHistoriesRequestDto,
    @Req() req: Request,
  ): Promise<GetClaimHistoriesResponseDto> {
    const user = req.user as AccessTokenPayload;

    const filter = [Role.ADMIN, Role.OPERATOR, Role.AUDITOR].includes(user.role)
      ? ClaimHistoryFilter.EVENT_ID
      : ClaimHistoryFilter.EVENT_ID_AND_USER_ID;

    return await firstValueFrom<GetClaimHistoriesResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.GET_CLAIM_HISTORIES, {
        filter,
        userId:
          filter === ClaimHistoryFilter.EVENT_ID_AND_USER_ID
            ? user.userId
            : undefined,
        eventId: id.toString(),
        timeAt: query.timeAt,
        limit: query.limit,
      } as GetClaimHistoriesRequestDto),
    );
  }
}
