import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessage } from '../constants/error-codes.enum';

type ErrorResponse = {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
};

export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly details?: Record<string, any>,
    customMessage?: string,
  ) {
    const message =
      customMessage || ErrorMessage[code] || '알 수 없는 오류가 발생했습니다.';
    const response: ErrorResponse = {
      statusCode,
      code,
      message,
      details,
    };

    super(response, statusCode);
    this.name = this.constructor.name;
  }
}

// 공통 예외 클래스
export class NotFoundException extends BusinessException {
  constructor(entity: string, details?: Record<string, any>) {
    const message = `${entity}을(를) 찾을 수 없습니다.`;
    super(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      { entity, ...details },
      message,
    );
  }
}

export class ValidationException extends BusinessException {
  constructor(details: Record<string, any>) {
    super(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      details,
      '유효성 검사에 실패했습니다.',
    );
  }
}

export class ConflictException extends BusinessException {
  constructor(entity: string, details?: Record<string, any>) {
    const message = `${entity}이(가) 이미 존재합니다.`;
    super(
      ErrorCode.CONFLICT,
      HttpStatus.CONFLICT,
      { entity, ...details },
      message,
    );
  }
}

export class InternalServerErrorException extends BusinessException {
  constructor(details?: Record<string, any>) {
    super(
      ErrorCode.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      '서버 내부 오류가 발생했습니다.',
    );
  }
}

// 도메인별 예외 클래스
export class UserNotFoundException extends NotFoundException {
  constructor(userId: number | string) {
    const message =
      typeof userId === 'number'
        ? `사용자 ID ${userId}를 찾을 수 없습니다.`
        : `사용자 '${userId}'를 찾을 수 없습니다.`;

    super('사용자', { userId, message });
  }
}

export class ExamValidationException extends ValidationException {
  constructor(details: Record<string, any>) {
    super(details);
  }
}

export class ExamNotFoundException extends NotFoundException {
  constructor(examId: number) {
    const message = `ID ${examId}번 시험을 찾을 수 없습니다.`;
    super('시험', { examId, message });
  }
}
