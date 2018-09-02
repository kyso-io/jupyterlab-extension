import { JupyterLabMenu } from '@jupyterlab/mainmenu'
import Preview from './commands/preview'
import Publish from './commands/publish'
import OpenStudy from './commands/open-study'
import { getUser } from './utils/auth'
import Logout from './commands/logout'
import Login from './commands/login'


class _KysoMenu extends JupyterLabMenu {
  constructor(options) {
    super(options)
    this.menu.title.label = 'Kyso'
    this.editorViewers = new Set()
  }
}

export default class {
  constructor(props) {
    this.props = props
    const {
      app, openStudy, preview, publish, login, logout, manager
    } = this.props

    const user = getUser()
    this.state = { user }
    const { shell } = app

    const commandProps = {
      shell,
      manager,
      refreshUser: (u) => this.refreshUser(u),
      user
    }

    app.commands.addCommand(publish, Publish(commandProps))
    app.commands.addCommand(preview, Preview(commandProps))
    app.commands.addCommand(openStudy, OpenStudy(commandProps))
    app.commands.addCommand(login, Login(commandProps))
    app.commands.addCommand(logout, Logout(commandProps))
  }

  refreshUser() {
    const user = getUser()
    this.setState({ user })
  }

  setState(obj) {
    this.state = Object.assign(this.state, obj)
    this.render()
  }

  clean() {
    const {
      mainMenu,
      app
    } = this.props

    if (mainMenu.kysoMenu) {
      mainMenu.removeMenu(mainMenu.kysoMenu.menu)
    }
    mainMenu.kysoMenu = new _KysoMenu({ commands: app.commands }) // eslint-disable-line
    mainMenu.addMenu(mainMenu.kysoMenu.menu, { rank: 2000 })
  }

  render() {
    // I'd love to use react, but its not possible
    // so I'll try simulate some features
    this.clean()

    const {
      mainMenu, preview, openStudy, publish, logout, login
    } = this.props

    const { user } = this.state

    if (user) {
      mainMenu.kysoMenu.addGroup([{ command: publish }, { command: preview }, { command: openStudy }], 20)
      mainMenu.kysoMenu.addGroup([{ command: logout }], 50)
    } else {
      mainMenu.kysoMenu.addGroup([{ command: login }], 20)
    }
  }
}
