import { EventDto } from './event.dto';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

export class CreateEventRequestDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => EventDto)
  event: EventDto;
}
