export type SocketEvent =
  | "LOGIN"
  | "REGISTER"
  | "RE_LOGIN"
  | "MESSAGE"
  | "LOGOUT";

export interface LoginSuccess {
  RE_LOGIN_CODE?: string;
}

export interface ErrorPayload {
  message?: string;
}

export type SocketSuccessMap = {
  LOGIN: LoginSuccess;
  REGISTER: LoginSuccess;
  RE_LOGIN: LoginSuccess;
  MESSAGE: unknown;
  LOGOUT: unknown;
};

export type SocketError = {
  status: "error";
  event: SocketEvent;
  data?: ErrorPayload;
  mes?: string;
};

export type SocketSuccess<E extends SocketEvent> = {
  status: "success";
  event: E;
  data: SocketSuccessMap[E];
};

export type SocketResponse =
  | SocketError
  | {
      [E in SocketEvent]: SocketSuccess<E>;
    }[SocketEvent];
