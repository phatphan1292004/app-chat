export type SocketEvent =
  | "AUTH"
  | "LOGIN"
  | "REGISTER"
  | "RE_LOGIN"
  | "MESSAGE"
  | "LOGOUT"
  | "CREATE_ROOM"
  | "GET_ROOM_CHAT_MES"
  | "GET_PEOPLE_CHAT_MES"
  | "JOIN_ROOM"
  | "GET_USER_LIST"
  | "CHECK_USER"
  | "SEND_CHAT";

export interface LoginSuccess {
  RE_LOGIN_CODE?: string;
}

export interface ErrorPayload {
  message?: string;
}

export interface CreateRoomSuccess {
  roomId?: string;
  name?: string;
}

export interface SearchRoomSuccess {
  rooms?: Array<{
    name: string;
    roomId: string;
    page?: number;
  }>;
}

export interface ChatMessage {
  id?: number;
  sender: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
  reactions?: Record<string, number>;
  isSticker?: boolean;
}

export interface RoomChatMessagesSuccess {
  messages?: ChatMessage[];
  roomName?: string;
  page?: number;
}

export interface PeopleChatMessagesSuccess {
  messages?: ChatMessage[];
  username?: string;
  page?: number;
}

export interface JoinRoomSuccess {
  roomName?: string;
  name?: string;
}

export interface CheckUserSuccess {
  exists: boolean;
  user?: string;
}

export interface SendChatSuccess {
  id?: string;
  timestamp?: string;
}

export type GetUserListSuccess = Array<{
  name: string;
  type: number;
  actionTime: string;
}>;

export type SocketSuccessMap = {
  AUTH: never;
  LOGIN: LoginSuccess;
  REGISTER: LoginSuccess;
  RE_LOGIN: LoginSuccess;
  MESSAGE: unknown;
  LOGOUT: unknown;
  CREATE_ROOM: CreateRoomSuccess;
  GET_ROOM_CHAT_MES: RoomChatMessagesSuccess;
  GET_PEOPLE_CHAT_MES: PeopleChatMessagesSuccess;
  JOIN_ROOM: JoinRoomSuccess;
  GET_USER_LIST: GetUserListSuccess;
  CHECK_USER: CheckUserSuccess;
  SEND_CHAT: SendChatSuccess;
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
