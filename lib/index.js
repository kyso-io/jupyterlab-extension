import { IDocumentManager } from '@jupyterlab/docmanager';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import KysoMenu from './menu';
import '../style/index.css';

const preview = 'kyso:preview';
const publish = 'kyso:publish';
const login = 'kyso:login';
const logout = 'kyso:logout';

export const activate = (app, palette, manager, mainMenu) => {
  console.log('i am gone');
  const kysoMenu = new KysoMenu({
    mainMenu,
    manager,
    app,
    preview,
    publish,
    login,
    logout
  });

  kysoMenu.render();
};

const plugin = {
  id: '@jupyterlab/kyso',
  requires: [ICommandPalette, IDocumentManager, IMainMenu],
  activate,
  autoStart: true
};

export default plugin;