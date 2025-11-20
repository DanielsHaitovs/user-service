import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

export const BAD_REQUEST_DESCRIPTION =
  'The request contains invalid parameters or was missing required parameters.';

export const INPUT_BAD_REQUEST_MSG = [
  'sortOrder must be either ASC or DESC',
  'page must be an integer number',
  'limit must be an integer number',
] as string[];

export const INTERNAL_SERVER_ERROR_MSG =
  'Internal server error, please reach out to support or try again later.';

export const INTERNAL_SERVER_ERROR_DOCUMENTATION = {
  description: InternalServerErrorException.name,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 500 },
      message: {
        type: 'string',
        example: INTERNAL_SERVER_ERROR_MSG,
      },
      error: { type: 'string', example: InternalServerErrorException.name },
    },
  },
};

export const DELETE_BAD_REQUEST_MSG = {
  description: 'Invalid UUID format in one or more IDs',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: {
        oneOf: [
          {
            type: 'string',
            example: ['Each value in ids must be a valid UUID'],
          },
          {
            type: 'string',
            example: 'No IDs provided for deletion',
          },
        ],
      },
      error: { type: 'string', example: BadRequestException.name },
    },
  },
};
