export type SocketUser = {
  id: string;
  name?: string;
};

// ******************** INCOMING ***********************

type WithSource = {
  source: SocketUser;
};

export interface MessagesToClient {
  register: {
    type: 'register';
    userId: string;
  };
  chatMessage: {
    type: 'chatMessage';
    text: string;
  } & WithSource;

  'new-ice-candidate': {
    type: 'new-ice-candidate';
  };
  'user-joined-room': {
    type: 'user-joined-room';
  } & WithSource;
  'user-left-room': {
    type: 'user-left-room';
  } & WithSource;
}

// This type enforces every message type to contain a "type" field.
export type MessageToClientType =
  MessagesToClient[keyof MessagesToClient]['type'];
// This type enforces every key to match its "type" field.
export type MessageToClientValues = MessagesToClient[MessageToClientType];

// ******************** OUTGOING ***********************

type WithDestination = {
  to: SocketUser;
};

export interface MessagesToServer {
  register: {
    type: 'register';
    roomId: string;
    name?: string;
  };
  chatMessage: {
    type: 'chatMessage';
    text: string;
  };
}

// This type enforces every message type to contain a "type" field.
export type MessageToServerType =
  MessagesToServer[keyof MessagesToServer]['type'];
// This type enforces every key to match its "type" field.
export type MessageToServerValues = MessagesToServer[MessageToServerType];
