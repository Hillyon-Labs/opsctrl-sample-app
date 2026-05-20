import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Note } from './entities/note.entity';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { NOTE_PROCESSING_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note]),
    BullModule.registerQueue({ name: NOTE_PROCESSING_QUEUE }),
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
