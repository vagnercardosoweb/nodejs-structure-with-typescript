export default {
  responses: {
    error: {
      description: 'Error response',
      content: {
        'application/json; charset=utf-8': {
          schema: { $ref: '#/components/schemas/error' },
        },
      },
    },
  },

  schemas: {
    error: {
      title: 'ResponseError',
      description: 'Default object returned in case of error',
      required: ['*'],
      properties: {
        name: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'integer', description: 'HTTP Status Code' },
        requestId: { type: 'string' },
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
