import kyso from '@kyso/client';
import Cookies from 'universal-cookie';
import config from '../config';

export const getUser = async () => {
  const cookies = new Cookies();
  const _user = cookies.get('user');
  console.log(_user);

  if (!_user) return null;
  try {
    const user = await kyso.getMe({
      token: _user.sessionToken,
      apiUrl: config.API_URL
    });

    setCookie(user);
    return user;
  } catch (err) {
    return null;
  }
};

export const removeUserCookie = () => {
  const cookies = new Cookies();
  cookies.remove('user', {
    domain: 'kyso.io',
    httpOnly: false
  });
};

export const setCookie = json => {
  const cookies = new Cookies();
  cookies.set('user', JSON.stringify(json, null, 2), {
    domain: 'kyso.io',
    httpOnly: false
  });
};