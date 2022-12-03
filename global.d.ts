declare namespace Express {
  export interface Request {
    context: {
      jwt: {
        sub: string;
        token: string;
        type: string;
      };
    };
  }
}
