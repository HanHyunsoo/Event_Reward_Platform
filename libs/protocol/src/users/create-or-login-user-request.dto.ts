import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrLoginUserRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
