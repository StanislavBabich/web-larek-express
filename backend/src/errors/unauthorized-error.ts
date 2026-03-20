export default class UnauthorizedError extends Error {
  public statusCode: number;

  constructor(message = 'Unauthorized') {
    super(message);
    this.statusCode = 401;
  }
}
