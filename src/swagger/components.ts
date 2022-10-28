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
        statusCode: { type: 'number' },
        message: { type: 'string' },
        errorId: { type: 'string' },
        originalError: {
          type: 'object',
          nullable: true,
          properties: {
            name: { type: 'string' },
            message: { type: 'string' },
            stack: {
              $ref: '#/components/schemas/default-error/properties/stack',
            },
          },
        },
        metadata: { type: 'object' },
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
