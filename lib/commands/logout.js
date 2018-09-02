/* global localStorage */
import { removeUserCookie } from '../utils/auth';

const execute = ({ refreshUser }) => () => {
  removeUserCookie();
  refreshUser(null);
};

const command = ({ refreshUser }) => ({
  label: 'Log out of Kyso',
  execute: execute({ refreshUser })
});

export default command;