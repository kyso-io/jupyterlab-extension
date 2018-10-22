import kysoPopup from '@kyso/auth-popup';
import { setCookie } from '../utils/auth';
import config from '../config';

const execute = ({ refreshMenuState }) => async () => {
  const user = await kysoPopup({
    apiUrl: config.API_URL,
    authServer: config.AUTH_SERVER
  });
  setCookie(user);
  refreshMenuState();
};

const command = ({ shell, refreshMenuState }) => ({
  label: 'Log into Kyso',
  execute: execute({ shell, refreshMenuState })
});

export default command;