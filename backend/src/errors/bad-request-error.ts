export default class BadRequestError extends Error {
  public statusCode: number;

  constructor(message = 'Bad request') {
    super(message);
    this.statusCode = 400;
  }
}
