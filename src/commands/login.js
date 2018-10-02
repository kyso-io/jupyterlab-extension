import { setCookie } from '../utils/auth'
import kysoPopup from '@kyso/auth-popup'
import config from '../config.js'

const execute = ({ refreshMenuState }) => async () => {
  const user = await kysoPopup({
    apiUrl: config.API_URL,
    authServer: config.AUTH_SERVER
  })
  setCookie(user)
  refreshMenuState()
}

const command = ({ shell, refreshMenuState }) => ({
  label: 'Log into Kyso',
  execute: execute({ shell, refreshMenuState })
})

export default command
