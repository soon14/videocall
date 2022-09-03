import { messageHandlerArgs } from ".";
import { IncomingSocketMessage } from "../Socket/SocketMessage";

interface ChatMessageMessage extends IncomingSocketMessage {
  text: string;
}

export const handleChatMessage = ({
  broadcastToRoom,
  msg,
}: messageHandlerArgs<ChatMessageMessage>) => {
  broadcastToRoom({
    type: "chatMessage",
    text: msg.text,
  });
};
