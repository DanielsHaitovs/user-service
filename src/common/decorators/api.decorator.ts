import { BAD_REQUEST_DESCRIPTION } from '@/commonConst/system.const';
import {
  applyDecorators,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  type Type,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { EntityNotFoundError } from 'typeorm';

export interface ApiOkListOptions {
  operation: {
    summary: string;
    description: string;
  };
  okOperation?: {
    type: Type<unknown>;
    description: string;
    isArray: boolean;
  };
  badRequestMessages?: {
    description?: string;
    examples?: string[];
  };
  body?: {
    description: string;
    type: Type<unknown>;
    isArray?: boolean;
  };
  createdResponse?: {
    description: string;
    type: Type<unknown>;
    isArray?: boolean;
  };
  conflictMessage?: {
    description?: string;
  };
  noContent?: {
    description: string;
  };
  notFound?: {
    description: string;
    example?: string;
  };
}

export const ApiOkList = (options: ApiOkListOptions): MethodDecorator => {
  const decorators: MethodDecorator[] = [];

  decorators.push(
    ApiOperation({
      summary: options.operation.summary,
      description: options.operation.description,
    }),
  );

  if (options.body) {
    decorators.push(
      ApiBody({
        description: options.body.description,
        type: options.body.type,
        required: true,
        isArray: options.body.isArray ?? false,
      }),
    );
  }

  if (options.createdResponse) {
    decorators.push(
      ApiCreatedResponse({
        description: options.createdResponse.description,
        type: options.createdResponse.type,
        isArray: options.createdResponse.isArray ?? false,
      }),
    );
  }

  if (options.okOperation) {
    decorators.push(
      ApiOkResponse({
        description: options.okOperation.description,
        type: options.okOperation.type,
        isArray: options.okOperation.isArray,
      }),
    );
  }

  if (options.conflictMessage) {
    decorators.push(
      ApiConflictResponse({
        description: options.conflictMessage.description ?? 'Conflict error',
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: {
              type: 'string',
              example: options.conflictMessage.description ?? 'Conflict error',
            },
            error: { type: 'string', example: ConflictException.name },
          },
        },
      }),
    );
  }

  if (options.noContent) {
    decorators.push(
      ApiNoContentResponse({
        description: options.noContent.description,
      }),
    );
  }

  if (options.notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: options.notFound.description,
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example: options.notFound.example ?? 'Entity not found',
            },
            error: { type: 'string', example: EntityNotFoundError.name },
          },
        },
      }),
    );
  }

  decorators.push(
    ApiBadRequestResponse({
      description:
        options.badRequestMessages?.description ?? BAD_REQUEST_DESCRIPTION,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'array',
            items: { type: 'string' },
            example: options.badRequestMessages?.examples ?? [],
          },
          error: { type: 'string', example: BadRequestException.name },
        },
      },
    }),
  );

  decorators.push(
    ApiNotFoundResponse({
      description: 'One or more referenced entities not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'Entity not found' },
          error: { type: 'string', example: EntityNotFoundError.name },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: UnauthorizedException.name,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
          error: { type: 'string', example: UnauthorizedException.name },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden access',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden' },
          error: { type: 'string', example: ForbiddenException.name },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: InternalServerErrorException.name,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: {
            type: 'string',
            example: InternalServerErrorException.name,
          },
          error: { type: 'string', example: InternalServerErrorException.name },
        },
      },
    }),
  );

  return applyDecorators(...decorators);
};
