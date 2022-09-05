import { messageHandlerArgs } from '.';
import { RelayMessages } from '../Socket/SocketTypes';
import { userToSocketUser } from '../util';

export const relayMessage = ({
  sendToUser,
  msg,
  user,
}: messageHandlerArgs<RelayMessages[keyof RelayMessages]>) => {
  const { target, ...rest } = msg;
  sendToUser(msg.target, {
    ...rest,
    source: userToSocketUser(user),
  });
};
