import { v4 as uuidv4 } from 'uuid';
import { SocketUser } from './Socket/SocketTypes';
import { User } from './StateRepository/StateRepository';

export const generateUserId = () => {
  return uuidv4();
};

export const userToSocketUser = ({ id, name }: User): SocketUser => ({
  id,
  name: name || undefined,
});
