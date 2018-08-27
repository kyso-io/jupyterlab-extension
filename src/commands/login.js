/* global localStorage */
import Auth0Lock from 'auth0-lock'
import Cookies from 'js-cookie'

const execute = ({ refreshUser }) => () => {
  const lock = new Auth0Lock(
    's22ZBD7K6xv9oB9OP51nA3dfI5k66BFm',
    'kyso.eu.auth0.com',
    {
      auth: {
        redirect: false
      }
    }
  )

  window.Cookies = Cookies

  lock.on('authenticated', (authResult) => {
    lock.getUserInfo(authResult.accessToken, (error, user) => {
      if (error) {
        throw error
      }

      console.log(user.parse_user)
      Cookies.set('accessToken', authResult.accessToken, { domain: '.kyso.io' })
      Cookies.set('user', JSON.stringify(user.parse_user), { domain: '.kyso.io' })
      refreshUser()
      lock.hide()
    })
  })

  lock.show()
}

const command = ({ shell, refreshUser }) => ({
  label: 'Log into Kyso',
  execute: execute({ shell, refreshUser })
})

export default command
