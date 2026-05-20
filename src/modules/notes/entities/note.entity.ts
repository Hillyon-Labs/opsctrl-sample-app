import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/entity/entity';
import { NoteStatus } from '../dto/note-response.dto';

@Entity('notes')
export class Note extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    default: NoteStatus.PENDING,
  })
  status: NoteStatus;
}
