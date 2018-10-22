import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import KysoMenu from './menu';
import '../style/index.css';

const plugin = {
  id: '@jupyterlab/kyso',
  requires: [ICommandPalette, IDocumentManager, IMainMenu, IFileBrowserFactory],
  autoStart: true
};

export const activate = async (app, palette, manager, mainMenu, fileBrowserTracker) => {
  window.app = app; // eslint-disable-line

  const kysoMenu = new KysoMenu({
    fileBrowserTracker,
    mainMenu,
    manager,
    app
  });

  kysoMenu.render();
};

plugin.activate = activate;

export default plugin;