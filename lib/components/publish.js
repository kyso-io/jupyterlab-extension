var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/* global File */
import React from 'react';
import { Line } from 'rc-progress';
import Spinner from 'react-spinkit';
import kyso from '@kyso/client';
import { VDomRenderer } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import config from '../config';
import { getUser } from '../utils/auth';

const slugPattern = new RegExp('^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$');

export const LAUNCHER_CLASS = 'kyso-publish';

const sort = items => {
  const notebooks = items.filter(i => i.type === "notebook");
  const directories = items.filter(i => i.type === "directory");
  const files = items.filter(i => i.type !== "notebook" && i.type !== "directory");
  return [].concat(directories, notebooks, files);
};

const getName = msg => {
  let name = prompt(msg); // eslint-disable-line
  if (!slugPattern.test(name)) {
    alert(`Study name can only consist of letters, numbers, '_' and '-'. ${name} didnt match.`); // eslint-disable-line
    return null;
  }

  name = name.toString().toLowerCase() // eslint-disable-line
  .replace(/\s+/g, '-') // Replace spaces with
  .replace(/[^\w\-]+/g, '') // eslint-disable-line
  .replace(/\-\-+/g, '-') // eslint-disable-line
  .replace(/^-+/, '') // Trim - from start of text
  .replace(/-+$/, '');

  return name;
};

export default class extends VDomRenderer {
  constructor(props) {
    super(props);
    this.addClass(LAUNCHER_CLASS);
    this.props = props;
  }

  render() {
    return React.createElement(Component, this.props);
  }
}

class Component extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.props = _extends({
      user: getUser()
    }, props);
    this.filebrowser = new FileBrowserModel({
      manager: props.manager, // eslint-disable-line
      driveName: '',
      state: null
    });

    this.state = {
      items: [],
      content: null,
      error: null,
      busy: false,
      published: false,
      progress: null
    };
  }

  async componentDidMount() {
    const kysofile = await this.getKysoFile();
    if (kysofile) {
      const author = kysofile.split('/')[0].trim();
      if (author === this.props.user.nickname) {
        this.setState({ name: kysofile.split('/')[1].trim() });
      }
    }

    this.filebrowser.refreshed.connect(fb => {
      this.setState({
        items: sort(fb._items)
      });
    });

    this.filebrowser.refresh();
    this.filebrowser.cd(this.getCwd());
  }

  onClick(item) {
    if (item.type === 'notebook') {
      this.startPublish(item.path);
    } else if (item.type === 'directory') {
      this.cd(item);
    } else {
      this.setState({ error: 'whoops! Not a jupyter notebook' });
    }
  }

  async getKysoFile() {
    try {
      const _kysofile = await this.filebrowser.manager.services.contents.get(`${this.getCwd()}/.kyso`);
      const kysofile = _kysofile.content;
      return kysofile;
    } catch (err) {
      // no kysofile
      return null;
    }
  }

  getCwd() {
    return this.props.fileBrowserTracker.tracker.currentWidget.model.path; // eslint-disable-line
  }

  back() {
    this.cd({ name: ".." });
  }

  cd(item) {
    this.filebrowser.cd(item.name);
    this.setState({ error: null });
  }

  async startPublish(main) {
    this.setState({ busy: true, progress: null });
    const { items } = this.state;
    const { user, refreshMenuState } = this.props;
    const filebrowser = this.filebrowser;

    let name = null;
    const kysofile = await this.getKysoFile();

    if (kysofile) {
      name = kysofile.split('/')[1].trim();
      const author = kysofile.split('/')[0].trim();
      if (author !== user.nickname) {
        name = getName(`Name this study?\n(this was forked from ${author}/${name})`);
      }
    }

    if (!kysofile) {
      name = getName('Name this study?'); // eslint-disable-line

      const existingStudy = await kyso.getStudy({
        token: user.sessionToken,
        author: user.nickname,
        name,
        apiUrl: config.API_URL
      });

      if (existingStudy) {
        const y = confirm(`Study ${name} already exists, do you want to push an update to it?`); // eslint-disable-line
        if (!y) {
          name = null;
        }
      }
    }

    if (!name) {
      this.setState({ busy: false });
      return; // the user cancelled the prompts
    }

    const promises = items.map(async item => {
      const file = await filebrowser.manager.services.contents.get(item.path);
      const data = file.format === 'json' ? JSON.stringify(file.content) : file.content;
      return { path: file.path, data: kyso.Buffer.from(data) };
    });
    const files = await Promise.all(promises);

    this.setState({ busy: true, name });

    try {
      await kyso.publish({
        name,
        main,
        token: user.sessionToken,
        files,
        apiUrl: config.API_URL,
        onProgress: ev => {
          this.setState({ progress: Math.round(ev.loaded * 100 / ev.total) });
        }
      });
    } catch (err) {
      console.error(err);
      this.setState({ progress: null, busy: false, published: false });
      if (err.message) {
        return this.setState({ error: err.message });
      }
      return this.setState({ error: 'An unknown error occurred.' });
    }

    if (name && !kysofile) {
      await filebrowser.upload(new File([`${user.nickname}/${name}`], `.kyso`, { type: 'text/plain' }));
      refreshMenuState();
    }
    return this.setState({ progress: null, busy: false, published: true });
  }

  render() {
    const { items, name, error, progress, busy, published } = this.state;
    const { user } = this.props; // eslint-disable-line

    return React.createElement(
      'div',
      { className: 'jp-Launcher-body' },
      React.createElement(
        'div',
        { className: 'jp-Launcher-content' },
        !error && !published && !busy && React.createElement(
          'p',
          null,
          React.createElement(
            'a',
            {
              className: 'preview-link',
              href: '/preview-link',
              style: { marginLeft: '0px' },
              onClick: e => {
                e.preventDefault();
                this.back();
              }
            },
            '<',
            ' back'
          )
        ),
        !name && React.createElement(
          'h2',
          null,
          'Publish to Kyso'
        ),
        name && React.createElement(
          'h2',
          null,
          'Publishing',
          '  ',
          React.createElement(
            'a',
            {
              href: `${config.UI_URL}/${user.nickname}/${name}`,
              rel: 'noopener noreferrer',
              target: '_blank'
            },
            user.nickname,
            '/',
            name
          )
        ),
        published && React.createElement(
          'p',
          null,
          React.createElement(
            'a',
            {
              target: '_blank',
              rel: 'noopener noreferrer',
              href: `${config.UI_URL}/${user.nickname}/${name}`
            },
            'View ',
            `${user.nickname}/${name}`,
            ' on Kyso'
          )
        ),
        !error && !published && !busy && React.createElement(
          'p',
          null,
          'Choose which notebook will be the main notebook displayed on Kyso (don',
          "'",
          't worry all files will be included in a reproducible repository on Kyso).'
        ),
        React.createElement(
          'p',
          null,
          'Directory: ',
          this.getCwd(),
          '/'
        ),
        React.createElement('br', null),
        error && React.createElement(
          'p',
          null,
          React.createElement(
            'strong',
            null,
            error
          )
        ),
        busy && !progress && React.createElement(
          'div',
          null,
          React.createElement(Spinner, { name: 'circle', fadeIn: 'none' })
        ),
        progress && React.createElement(
          'div',
          null,
          React.createElement(Line, { percent: progress.toString() }),
          ' ',
          `${progress}%`
        ),
        !error && !published && !busy && items.map(item => React.createElement(
          'p',
          { key: item.name },
          item.type !== "notebook" && item.type !== "directory" && React.createElement(
            'span',
            null,
            item.name
          ),
          item.type === "notebook" && React.createElement(
            'span',
            null,
            item.name,
            '  ',
            React.createElement(
              'a',
              {
                href: '/preview-link',
                className: 'preview-link',
                onClick: e => {
                  e.preventDefault();
                  this.onClick(item);
                }
              },
              'Select'
            )
          ),
          item.type === "directory" && React.createElement(
            'span',
            null,
            React.createElement(
              'a',
              {
                className: 'directory-link',
                href: '/directory-link',
                onClick: e => {
                  e.preventDefault();
                  this.onClick(item);
                }
              },
              item.name,
              '/'
            )
          )
        ))
      )
    );
  }
}