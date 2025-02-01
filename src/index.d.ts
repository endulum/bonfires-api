declare global {
  namespace Express {
    export interface Request {
      formErrors?: Record<string, string>;
    }
  }
}

export {};
