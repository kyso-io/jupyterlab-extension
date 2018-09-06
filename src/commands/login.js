import { setCookie } from '../utils/auth'
import kysoPopup from '@kyso/auth-popup'

const execute = ({ refreshMenuState }) => async () => {
  const user = await kysoPopup()
  setCookie(user)
  refreshMenuState()
}

const command = ({ shell, refreshMenuState }) => ({
  label: 'Log into Kyso',
  execute: execute({ shell, refreshMenuState })
})

export default command
