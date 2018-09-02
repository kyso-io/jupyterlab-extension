import Cookies from 'js-cookie';

export const getUser = () => Cookies.getJSON('user');

export const removeUserCookie = () => Cookies.remove('user');

export const setCookie = json => Cookies.set('user', JSON.stringify(json, null, 2));