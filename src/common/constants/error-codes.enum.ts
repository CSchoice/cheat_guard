export enum ErrorCode {
  // 공통 에러 (1000~1999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  // 사용자 관련 에러 (2000~2999)
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // 시험 관련 에러 (3000~3999)
  EXAM_NOT_FOUND = 'EXAM_NOT_FOUND',
  EXAM_VALIDATION_ERROR = 'EXAM_VALIDATION_ERROR',
  EXAM_ALREADY_STARTED = 'EXAM_ALREADY_STARTED',
  EXAM_NOT_STARTED = 'EXAM_NOT_STARTED',
  EXAM_ALREADY_SUBMITTED = 'EXAM_ALREADY_SUBMITTED',
}

export const ErrorMessage: Record<ErrorCode, string> = {
  // 공통 에러 메시지
  [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.',
  [ErrorCode.VALIDATION_ERROR]: '유효성 검사에 실패했습니다.',
  [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.CONFLICT]: '이미 존재하는 리소스입니다.',
  [ErrorCode.BAD_REQUEST]: '잘못된 요청입니다.',

  // 사용자 관련 에러 메시지
  [ErrorCode.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [ErrorCode.USER_ALREADY_EXISTS]: '이미 존재하는 사용자입니다.',
  [ErrorCode.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 일치하지 않습니다.',

  // 시험 관련 에러 메시지
  [ErrorCode.EXAM_NOT_FOUND]: '시험을 찾을 수 없습니다.',
  [ErrorCode.EXAM_VALIDATION_ERROR]: '시험 유효성 검사에 실패했습니다.',
  [ErrorCode.EXAM_ALREADY_STARTED]: '이미 시작된 시험입니다.',
  [ErrorCode.EXAM_NOT_STARTED]: '아직 시작되지 않은 시험입니다.',
  [ErrorCode.EXAM_ALREADY_SUBMITTED]: '이미 제출된 시험입니다.',
};
