import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
