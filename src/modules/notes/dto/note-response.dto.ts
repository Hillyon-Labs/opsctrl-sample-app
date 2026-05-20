import { ApiProperty } from '@nestjs/swagger';

export enum NoteStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
}

export class NoteResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'My first note' })
  title: string;

  @ApiProperty({ example: 'This note was processed by a BullMQ worker.' })
  content: string;

  @ApiProperty({ enum: NoteStatus, example: NoteStatus.PENDING })
  status: NoteStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
