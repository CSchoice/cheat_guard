export interface LoginUserPayload {
  id: number;
  nickname: string;
  role: string;
  [key: string]: any; // Allow additional properties
}

export class LoginUserPayloadClass implements LoginUserPayload {
  constructor(
    public id: number,
    public nickname: string,
    public role: string,
  ) {}
}
