import { ApiProperty } from '@nestjs/swagger';
import { EventDto } from './event.dto';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

export class CreateEventRequestDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => EventDto)
  @ApiProperty({
    type: EventDto,
    description: '이벤트 정보',
  })
  event: EventDto;
}
