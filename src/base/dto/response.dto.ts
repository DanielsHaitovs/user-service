import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Indicates the amount of deleted records',
    example: 1,
    type: Number,
  })
  deleted: number;

  @ApiProperty({
    description: 'Descriptive message about the deletion operation',
    example: '1 records successfully deleted.',
    type: String,
  })
  message: string;

  constructor(deleted: number, message: string) {
    this.deleted = deleted;
    this.message = message;
  }
}
