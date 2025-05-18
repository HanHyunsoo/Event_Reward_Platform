import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('이벤트 보상 플랫폼 API 문서')
    .setDescription(
      `
Docker 컨테이너 생성시 초기 유저(아이디: admin, 비밀번호: admin, 권한: ADMIN)가 생성되므로 해당 유저로 로그인 후 API를 테스트 할 수 있습니다.

유저 로그인 후 토큰을 발급 받아 문서 오른쪽에 있는 Authorize 버튼을 클릭하고 토큰을 입력하여 매 요청시 인증을 진행할 수있습니다.
      `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  setupSwagger(app);
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('API_GATEWAY_PORT', '3000'));

  await app.listen(port);
}
bootstrap();
