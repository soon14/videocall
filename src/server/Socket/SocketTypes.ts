export type User = {
  id: string;
  name?: string;
};

// ******************** INCOMING ***********************

type WithSource = {
  source: User;
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
}

// This type enforces every message type to contain a "type" field.
export type MessageToClientType =
  MessagesToClient[keyof MessagesToClient]['type'];
// This type enforces every key to match its "type" field.
export type MessageToClientValues = MessagesToClient[MessageToClientType];

// ******************** OUTGOING ***********************

type WithDestination = {
  to: User;
};

export interface MessagesToServer {
  register: {
    type: 'register';
    roomId: string;
    name?: string;
  };
  disconnect: {
    type: 'disconnect';
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
