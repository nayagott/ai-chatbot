export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly userMessage: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage = '요청 형식이 올바르지 않습니다.') {
    super(message, 400, userMessage);
    this.name = 'ValidationError';
  }
}

export class BedrockApiError extends AppError {
  constructor(message: string, userMessage = 'AI 응답을 가져오는 중 오류가 발생했습니다.') {
    super(message, 500, userMessage);
    this.name = 'BedrockApiError';
  }
}
