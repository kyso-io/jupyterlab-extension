import { IDocumentManager } from '@jupyterlab/docmanager'
import { ICommandPalette } from '@jupyterlab/apputils'
import { IMainMenu } from '@jupyterlab/mainmenu'
import * as application from '@jupyterlab/application'
import KysoMenu from './menu'
import '../style/index.css'

const preview = 'kyso:preview'
const publish = 'kyso:publish'
const openStudy = 'kyso:openStudy'
const login = 'kyso:login'
const logout = 'kyso:logout'

export const activate = (app, palette, manager, mainMenu) => {
  window.application = application
  const kysoMenu = new KysoMenu({
    mainMenu,
    manager,
    app,
    preview,
    publish,
    openStudy,
    login,
    logout
  })

  kysoMenu.render()
}

const plugin = {
  id: '@jupyterlab/kyso',
  requires: [ICommandPalette, IDocumentManager, IMainMenu],
  activate,
  autoStart: true
}

export default plugin
