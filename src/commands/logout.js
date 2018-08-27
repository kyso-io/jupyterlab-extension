/* global localStorage */

const execute = ({ refreshUser }) => () => {
  localStorage.removeItem('user')
  refreshUser(null)
}

const command = ({ refreshUser }) => ({
  label: 'Log out of Kyso',
  execute: execute({ refreshUser })
})

export default command
