import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Note } from '../../notes/entities/note.entity';
import { NoteStatus } from '../../notes/dto/note-response.dto';
import { NOTE_PROCESSING_QUEUE } from '../queue.constants';

@Processor(NOTE_PROCESSING_QUEUE)
export class NoteProcessor extends WorkerHost {
  private readonly logger = new Logger(NoteProcessor.name);

  constructor(
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
  ) {}

  async process(job: Job<{ noteId: string }>): Promise<void> {
    const { noteId } = job.data;
    this.logger.log(`Processing note ${noteId} (job ${job.id})`);

    // Mark as processing
    await this.notesRepo.update(noteId, { status: NoteStatus.PROCESSING });

    // Simulate async work (e.g. enrichment, formatting, indexing)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mark as processed
    await this.notesRepo.update(noteId, { status: NoteStatus.PROCESSED });

    this.logger.log(`Note ${noteId} processed successfully`);
  }
}
