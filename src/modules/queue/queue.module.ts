import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteProcessor } from './processors/note.processor';
import { Note } from '../notes/entities/note.entity';
import { NOTE_PROCESSING_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTE_PROCESSING_QUEUE }),
    TypeOrmModule.forFeature([Note]),
  ],
  providers: [NoteProcessor],
})
export class QueueModule {}
