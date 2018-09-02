import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { JupyterLabMenu } from '@jupyterlab/mainmenu';
import Preview from './commands/preview';
import Publish from './commands/publish';
import OpenStudy from './commands/open-study';
import { getUser } from './utils/auth';
import Logout from './commands/logout';
import Login from './commands/login';

const isKysoFile = async (manager, user) => {
  const filebrowser = new FileBrowserModel({
    manager,
    driveName: '',
    state: null
  });

  let kysofile = null;
  try {
    const _kysofile = await filebrowser.manager.services.contents.get('.kyso');
    const author = _kysofile.content.split('/')[0].trim();
    if (author === user.nickname) {
      kysofile = _kysofile.content;
    }
  } catch (err) {
    // console.error(err)
  }

  return kysofile;
};

class _KysoMenu extends JupyterLabMenu {
  constructor(options) {
    super(options);
    this.menu.title.label = 'Kyso';
    this.editorViewers = new Set();
  }
}

export default class {
  constructor(props) {
    this.props = props;
    const { app, openStudy, preview, publish, login, logout, manager } = this.props;

    const user = getUser();
    this.state = { user, kysofile: null };

    const commandProps = {
      shell: app.shell,
      manager,
      refreshMenuState: u => this.refreshMenuState(u),
      user
    };

    app.commands.addCommand(publish, Publish(commandProps));
    app.commands.addCommand(preview, Preview(commandProps));
    app.commands.addCommand(openStudy, OpenStudy(commandProps));
    app.commands.addCommand(login, Login(commandProps));
    app.commands.addCommand(logout, Logout(commandProps));
  }

  async refreshMenuState() {
    const user = getUser();
    const { manager } = this.props;

    const kysofile = await isKysoFile(manager, user);
    this.setState({ user, kysofile });
  }

  setState(obj) {
    this.state = Object.assign(this.state, obj);
    this.render();
  }

  clean() {
    const {
      mainMenu,
      app
    } = this.props;

    if (mainMenu.kysoMenu) {
      mainMenu.removeMenu(mainMenu.kysoMenu.menu);
    }
    mainMenu.kysoMenu = new _KysoMenu({ commands: app.commands }); // eslint-disable-line
    mainMenu.addMenu(mainMenu.kysoMenu.menu, { rank: 2000 });
  }

  render() {
    // I'd love to use react, but its not possible
    // so I'll try simulate some features
    this.clean();

    const {
      mainMenu, preview, openStudy, publish, logout, login
    } = this.props;

    const { user, kysofile } = this.state;
    if (user) {
      if (kysofile) {
        mainMenu.kysoMenu.addGroup([{ command: publish }, { command: preview }, { command: openStudy }], 20);
      } else {
        mainMenu.kysoMenu.addGroup([{ command: publish }, { command: preview }], 20);
      }

      mainMenu.kysoMenu.addGroup([{ command: logout }], 50);
    } else {
      mainMenu.kysoMenu.addGroup([{ command: login }], 20);
    }
  }
}