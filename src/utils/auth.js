/* localStorage */
import Cookies from 'js-cookie'

export const getUser = () => Cookies.getJSON('user')
