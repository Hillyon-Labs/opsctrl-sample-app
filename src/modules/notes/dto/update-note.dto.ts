import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content.' })
  @IsString()
  @IsOptional()
  content?: string;
}
