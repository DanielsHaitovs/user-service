import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import type * as request from 'supertest';
import { EntityNotFoundError } from 'typeorm';

export function validateResponse({
  response,
  alias,
}: {
  response: request.Response;
  alias: string;
}): void {
  if (response.status === 400) {
    throw new BadRequestException(response.body.message);
  }

  if (response.status === 403) {
    throw new ForbiddenException(response.body.message);
  }

  if (response.status === 404) {
    throw new EntityNotFoundError(alias, response.body.message);
  }

  if (response.status === 409) {
    throw new ConflictException(response.body.message);
  }

  if (response.status === 401) {
    throw new UnauthorizedException(response.body.message);
  }

  if (response.status === 500) {
    throw new InternalServerErrorException(response.body.message);
  }
}
