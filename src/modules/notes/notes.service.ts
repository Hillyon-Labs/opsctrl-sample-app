import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NOTE_PROCESSING_QUEUE } from '../queue/queue.constants';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    @InjectQueue(NOTE_PROCESSING_QUEUE)
    private readonly noteQueue: Queue,
  ) {}

  async create(dto: CreateNoteDto): Promise<Note> {
    const note = this.notesRepo.create(dto);
    const saved = await this.notesRepo.save(note);

    // Enqueue background processing job to demonstrate Redis + BullMQ
    await this.noteQueue.add('process-note', { noteId: saved.id });

    return saved;
  }

  async findAll(): Promise<Note[]> {
    return this.notesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Note> {
    const note = await this.notesRepo.findOne({ where: { id } });
    if (!note) throw new NotFoundException(`Note ${id} not found`);
    return note;
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOne(id);
    Object.assign(note, dto);
    return this.notesRepo.save(note);
  }

  async remove(id: string): Promise<void> {
    const note = await this.findOne(id);
    await this.notesRepo.softRemove(note);
  }
}
