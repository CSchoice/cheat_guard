import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ message, code }, statusCode);
  }
}

export class UserNotFoundException extends BusinessException {
  constructor(userId: number | string) {
    super(
      typeof userId === 'number'
        ? `사용자 ID ${userId}를 찾을 수 없습니다.`
        : `사용자 '${userId}'를 찾을 수 없습니다.`,
      'USER_NOT_FOUND',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ExamValidationException extends BusinessException {
  constructor(message: string) {
    super(message, 'EXAM_VALIDATION_ERROR', HttpStatus.BAD_REQUEST);
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string) {
    super(message, 'CONFLICT', HttpStatus.CONFLICT);
  }
}

export class InternalServerErrorException extends BusinessException {
  constructor(message: string = '서버 내부 오류가 발생했습니다.') {
    super(message, 'INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
