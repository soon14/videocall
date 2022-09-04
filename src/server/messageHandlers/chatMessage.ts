import { messageHandlerArgs } from '.';
import { MessagesToServer } from '../Socket/SocketTypes';
import { userToSocketUser } from '../util';

export const handleChatMessage = ({
  broadcastToRoom,
  msg,
  user,
}: messageHandlerArgs<MessagesToServer['chatMessage']>) => {
  broadcastToRoom({
    type: 'chatMessage',
    text: msg.text,
    source: userToSocketUser(user),
  });
};
