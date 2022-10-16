const configCors = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: [
    'Accept',
    'Origin',
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Accept-Language',
    'X-Refresh-Token',
    'X-Aws-IdToken',
    'X-Test',
  ],
};

export default configCors;
