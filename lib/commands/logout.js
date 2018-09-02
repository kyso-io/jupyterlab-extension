/* global localStorage */
import { removeUserCookie } from '../utils/auth';

const execute = ({ refreshMenuState }) => () => {
  removeUserCookie();
  refreshMenuState(null);
};

const command = ({ refreshMenuState }) => ({
  label: 'Log out of Kyso',
  execute: execute({ refreshMenuState })
});

export default command;