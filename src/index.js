import { IDocumentManager } from '@jupyterlab/docmanager'
import { ICommandPalette } from '@jupyterlab/apputils'
import { IMainMenu } from '@jupyterlab/mainmenu'
import * as application from '@jupyterlab/application'
import KysoMenu from './menu'
import '../style/index.css'

const publish = 'kyso:publish'
const openStudy = 'kyso:openStudy'
const login = 'kyso:login'
const logout = 'kyso:logout'

const plugin = {
  id: '@jupyterlab/kyso',
  requires: [ICommandPalette, IDocumentManager, IMainMenu],
  autoStart: true
}

export const activate = async (app, palette, manager, mainMenu, settingRegistry) => {
  const kysoMenu = new KysoMenu({
    mainMenu,
    manager,
    app,
    publish,
    openStudy,
    login,
    logout
  })

  kysoMenu.render()
}

plugin.activate = activate

export default plugin
