import { FileBrowserModel } from '@jupyterlab/filebrowser'
import { JupyterLabMenu } from '@jupyterlab/mainmenu'
import Publish from './commands/publish'
import { getUser } from './utils/auth'
import Logout from './commands/logout'
import Help from './commands/help'
import MyProfile from './commands/my-profile'
import Login from './commands/login'
import Clone from './commands/clone'

const isKysoFile = async (fileBrowserTracker, manager, user) => {
  const filebrowser = new FileBrowserModel({
    manager,
    driveName: '',
    state: null
  })

  let kysofile = null
  try {
    const _kysofile = await filebrowser.manager.services.contents.get(
      `${fileBrowserTracker.tracker.currentWidget.model.path}/.kyso`
    )
    const author = _kysofile.content.split('/')[0].trim()
    if (author === user.nickname) {
      kysofile = _kysofile.content
    }
  } catch (err) {
    // console.error(err)
  }

  return kysofile
}

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
    this.state = {}
  }

  async refreshMenuState() {
    const user = await getUser()
    const { manager, fileBrowserTracker } = this.props
    const kysofile = await isKysoFile(fileBrowserTracker, manager, user)
    this.setState({ user, kysofile })
  }

  setState(obj) {
    this.state = Object.assign(this.state, obj)
    this.render()
  }

  async clean() {
    const { app, manager, mainMenu, fileBrowserTracker } = this.props

    const user = await getUser()
    this.state = {
      user,
      kysofile: await isKysoFile(fileBrowserTracker, manager, user)
    }

    const commandProps = {
      shell: app.shell,
      manager,
      fileBrowserTracker,
      refreshMenuState: () => this.refreshMenuState(),
      user
    }

    if (mainMenu.kysoMenu) {
      mainMenu.removeMenu(mainMenu.kysoMenu.menu)
    }

    mainMenu.kysoMenu = new _KysoMenu({ commands: app.commands }) // eslint-disable-line
    mainMenu.kysoMenu.publishMenu = new JupyterLabMenu({
      commands: app.commands
    }, false)

    mainMenu.kysoMenu.publishMenu.menu.title.label = 'Publish'
    mainMenu.addMenu(mainMenu.kysoMenu.menu, { rank: 2000 })

    if ('kyso:publish' in app.commands._commands) {
      delete app.commands._commands['kyso:publish']
    }

    if ('kyso:clone' in app.commands._commands) {
      delete app.commands._commands['kyso:clone']
    }

    if ('kyso:login' in app.commands._commands) {
      delete app.commands._commands['kyso:login']
    }

    if ('kyso:logout' in app.commands._commands) {
      delete app.commands._commands['kyso:logout']
    }

    if ('kyso:openStudy' in app.commands._commands) {
      delete app.commands._commands['kyso:openStudy']
    }

    if ('kyso:myProfile' in app.commands._commands) {
      delete app.commands._commands['kyso:myProfile']
    }

    if ('kyso:help' in app.commands._commands) {
      delete app.commands._commands['kyso:help']
    }

    if (user && user.teams) {
      user.teams.forEach(team => {
        if (`kyso:publish:${team.name}` in app.commands._commands) {
          delete app.commands._commands[`kyso:publish:${team.name}`]
        }
      })
    }

    app.commands.addCommand('kyso:publish', Publish(commandProps))

    if (user && user.teams) {
      user.teams.forEach(team => {
        app.commands.addCommand(`kyso:publish:${team.name}`, Publish({
          ...commandProps,
          team: team.name,
          labelOverride: `Publish to team: ${team.name}`
        }))
      })
    }

    app.commands.addCommand('kyso:clone', Clone(commandProps))
    app.commands.addCommand('kyso:login', Login(commandProps))
    app.commands.addCommand('kyso:logout', Logout(commandProps))
    app.commands.addCommand('kyso:myProfile', MyProfile(commandProps))
    app.commands.addCommand('kyso:help', Help(commandProps))
  }

  async render() {
    // I'd love to use react, but its not possible
    // so I'll try simulate some features
    await this.clean()

    const { mainMenu } = this.props

    const { user } = this.state
    if (user) {
      const cmds = []

      if (user.teams) {
        const newGroup = [
          { type: 'submenu', submenu: mainMenu.kysoMenu.publishMenu.menu },
          { command: 'publish:submenu' }
        ]
        const newCmds = [{ command: 'kyso:publish' }]
        user.teams.forEach(team => {
          newCmds.push({ command: `kyso:publish:${team.name}` })
        })

        mainMenu.kysoMenu.publishMenu.addGroup(newCmds)
        mainMenu.kysoMenu.addGroup(newGroup, 20)
      } else {
        cmds.push({ command: 'kyso:publish' })
      }

      cmds.push({ command: 'kyso:clone' })
      cmds.push({ command: 'kyso:myProfile' })
      mainMenu.kysoMenu.addGroup(cmds, 20)

      mainMenu.kysoMenu.addGroup([{ command: 'kyso:help' }, { command: 'kyso:logout' }], 50)
    } else {
      mainMenu.kysoMenu.addGroup([{ command: 'kyso:login' }], 20)
    }
  }
}
