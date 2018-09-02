/* global localStorage */
import Auth0Lock from 'auth0-lock'
import { setCookie } from '../utils/auth'
import config from '../config.js'

const execute = ({ refreshMenuState }) => () => {
  const lock = new Auth0Lock(
    // admin site public client key
    's22ZBD7K6xv9oB9OP51nA3dfI5k66BFm',
    'auth0.kyso.io',
    {
      configurationBaseUrl: 'https://cdn.eu.auth0.com',
      auth: {
        params: {
          api_url: config.API_URL
        },
        redirect: false
      }
    }
  )

  lock.on('authenticated', (authResult) => {
    lock.getUserInfo(authResult.accessToken, (error, user) => {
      if (error) throw error

      setCookie(user.parse_user)
      refreshMenuState()
      lock.hide()
    })
  })

  lock.show()
}

const command = ({ shell, refreshMenuState }) => ({
  label: 'Log into Kyso',
  execute: execute({ shell, refreshMenuState })
})

export default command
