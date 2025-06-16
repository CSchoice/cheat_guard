import { IsString, Length } from 'class-validator';

export class CreateExamRequestDto {
  @IsString()
  @Length(1, 100)
  title: string;
}
