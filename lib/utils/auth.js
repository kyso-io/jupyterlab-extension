import kyso from '@kyso/client';
import Cookies from 'js-cookie';
import config from '../config';

export const getUser = async () => {
  const _user = Cookies.getJSON('user');

  if (!_user) return null;
  const user = await kyso.getMe({
    token: _user.sessionToken,
    apiUrl: config.API_URL
  });

  setCookie(user);
  return user;
};

export const removeUserCookie = () => Cookies.remove('user');

export const setCookie = json => Cookies.set('user', JSON.stringify(json, null, 2));