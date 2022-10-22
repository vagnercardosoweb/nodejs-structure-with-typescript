const swaggerComponents = {
  responses: {
    default: {
      description: 'AppError',
      content: {
        'application/json': {
          schema: {
            description: 'AppError',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/default-error',
                },
              },
            },
          },
        },
      },
    },
  },

  schemas: {
    'default-error': {
      type: 'object',
      required: ['*'],
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        level: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'number' },
        stack: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  },

  securitySchemes: {
    bearerAuth: {
      in: 'header',
      type: 'http',
      scheme: 'bearer',
      description: 'Authorization token.',
    },
  },
};

export default swaggerComponents;
