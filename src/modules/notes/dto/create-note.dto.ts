import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'My first note', description: 'Note title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'This is the note content.',
    description: 'Note body',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
