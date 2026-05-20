import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@ApiTags('Notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a note',
    description:
      'Creates a note and enqueues a background processing job via BullMQ + Redis.',
  })
  @ApiResponse({ status: 201, type: NoteResponseDto })
  create(@Body() dto: CreateNoteDto): Promise<NoteResponseDto> {
    return this.notesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all notes' })
  @ApiResponse({ status: 200, type: [NoteResponseDto] })
  findAll(): Promise<NoteResponseDto[]> {
    return this.notesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiResponse({ status: 200, type: NoteResponseDto })
  findOne(@Param('id') id: string): Promise<NoteResponseDto> {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, type: NoteResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note (soft delete)' })
  remove(@Param('id') id: string): Promise<void> {
    return this.notesService.remove(id);
  }
}
