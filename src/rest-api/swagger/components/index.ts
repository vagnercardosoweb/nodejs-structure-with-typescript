import { HttpStatusCode } from '@/shared/enums';

export default {
  responses: {
    error: {
      description: 'Default Error',
      content: {
        'application/json; charset=utf-8': {
          schema: { $ref: '#/components/schemas/ResponseError' },
        },
      },
    },
  },

  schemas: {
    ResponseError: {
      description: 'Default object returned in case of error',
      required: [
        'name',
        'message',
        'statusCode',
        'requestId',
        'errorId',
        'code',
      ],
      properties: {
        name: { type: 'string' },
        message: { type: 'string' },
        statusCode: {
          description: 'HTTP Status Code',
          default: HttpStatusCode.BAD_REQUEST,
          type: 'integer',
        },
        requestId: { type: 'string', format: 'uuid' },
        errorId: { type: 'string' },
        code: { type: 'string' },
      },
    },
  },

  securitySchemes: {
    bearerAuth: {
      description: 'Authorization token',
      bearerFormat: 'JWT',
      scheme: 'bearer',
      type: 'http',
    },
  },
};
