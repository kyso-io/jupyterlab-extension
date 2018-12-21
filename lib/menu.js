import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { JupyterLabMenu } from '@jupyterlab/mainmenu';
import Publish from './commands/publish';
import { getUser } from './utils/auth';
import Logout from './commands/logout';
import Help from './commands/help';
import MyProfile from './commands/my-profile';
import Login from './commands/login';
import Clone from './commands/clone';

const publish = 'kyso:publish';
const openStudy = 'kyso:openStudy';
const login = 'kyso:login';
const logout = 'kyso:logout';
const help = 'kyso:help';
const clone = 'kyso:clone';
const myProfile = 'kyso:myProfile';

const isKysoFile = async (fileBrowserTracker, manager, user) => {
  const filebrowser = new FileBrowserModel({
    manager,
    driveName: '',
    state: null
  });

  let kysofile = null;
  try {
    const _kysofile = await filebrowser.manager.services.contents.get(`${fileBrowserTracker.tracker.currentWidget.model.path}/.kyso`);
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
    console.log('constructor for _KysoMenu');
  }
}

export default class {
  constructor(props) {
    console.log('constructor for KysoMenu');
    this.props = props;
    this.state = {};
    // this.clean()
    console.log('constructor for KysoMenu (2)');
  }

  async refreshMenuState() {
    const user = getUser();
    const { manager, fileBrowserTracker } = this.props;
    const kysofile = await isKysoFile(fileBrowserTracker, manager, user);
    this.setState({ user, kysofile });
  }

  setState(obj) {
    this.state = Object.assign(this.state, obj);
    this.render();
  }

  async clean() {
    console.log('clean');
    const { app, manager, mainMenu, fileBrowserTracker } = this.props;

    console.log('getting user');
    const user = getUser();
    console.log('got user');
    this.state = {
      user,
      kysofile: await isKysoFile(fileBrowserTracker, manager, user)
    };

    const commandProps = {
      shell: app.shell,
      manager,
      fileBrowserTracker,
      refreshMenuState: () => this.refreshMenuState(),
      user
    };

    console.log('adding menu stuff');
    if (mainMenu.kysoMenu) {
      mainMenu.removeMenu(mainMenu.kysoMenu.menu);
    }

    mainMenu.kysoMenu = new _KysoMenu({ commands: app.commands }); // eslint-disable-line
    mainMenu.addMenu(mainMenu.kysoMenu.menu, { rank: 2000 });

    if (publish in app.commands._commands) {
      delete app.commands._commands[publish];
    }

    if (clone in app.commands._commands) {
      delete app.commands._commands[clone];
    }

    if (login in app.commands._commands) {
      delete app.commands._commands[login];
    }

    if (logout in app.commands._commands) {
      delete app.commands._commands[logout];
    }

    if (openStudy in app.commands._commands) {
      delete app.commands._commands[openStudy];
    }

    if (myProfile in app.commands._commands) {
      delete app.commands._commands[myProfile];
    }

    if (help in app.commands._commands) {
      delete app.commands._commands[help];
    }

    console.log('adding commands');

    app.commands.addCommand(publish, Publish(commandProps));
    app.commands.addCommand(clone, Clone(commandProps));
    app.commands.addCommand(login, Login(commandProps));
    app.commands.addCommand(logout, Logout(commandProps));
    app.commands.addCommand(myProfile, MyProfile(commandProps));
    app.commands.addCommand(help, Help(commandProps));
  }

  async render() {
    console.log('render');
    // I'd love to use react, but its not possible
    // so I'll try simulate some features
    await this.clean();

    const { mainMenu } = this.props;

    const { user } = this.state;
    console.log('adding commands in render');
    if (user) {
      mainMenu.kysoMenu.addGroup([{ command: publish }, { command: clone }, { command: myProfile }], 20);
      mainMenu.kysoMenu.addGroup([{ command: help }, { command: logout }], 50);
    } else {
      mainMenu.kysoMenu.addGroup([{ command: login }], 20);
    }
  }
}