import React from 'react';
import JSZip from 'jszip';
import crypto from 'crypto-js';
import { Line } from 'rc-progress';
import Spinner from 'react-spinkit';
import { publish, Buffer } from '@kyso/publish';
import { VDomRenderer } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import config from '../config.js';

export const LAUNCHER_CLASS = 'kyso-publish';

const sort = items => {
  const notebooks = items.filter(i => i.type === "notebook");
  const directories = items.filter(i => i.type === "directory");
  const files = items.filter(i => i.type !== "notebook" && i.type !== "directory");
  return [].concat(directories, notebooks, files);
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
    const { manager } = this.props;
    this.filebrowser = new FileBrowserModel({
      manager,
      driveName: '',
      state: null
    });

    window.filebrowser = this.filebrowser;

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
    let kysofile = null;
    try {
      const _kysofile = await this.filebrowser.manager.services.contents.get('.kyso');
      kysofile = _kysofile.content;
    } catch (err) {
      // no kysofile
    }

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
  }

  async onClick(item) {
    if (item.type === "notebook") {
      this.startPublish(item.path);
    } else if (item.type === "directory") {
      this.cd(item);
    } else {
      this.setState({
        error: 'whoops! Not a jupyter notebook'
      });
    }
  }

  async back() {
    this.cd({ name: ".." });
  }

  async cd(item) {
    this.filebrowser.cd(item.name);
    this.setState({
      error: null
    });
  }

  async startPublish(main) {
    this.setState({ busy: true, progress: null });
    const { items } = this.state;
    const { user, refreshMenuState } = this.props;
    const filebrowser = this.filebrowser;

    const promises = items.map(async item => {
      const file = await filebrowser.manager.services.contents.get(item.path);
      const data = file.format === 'json' ? JSON.stringify(file.content) : file.content;
      return { path: file.path, data: Buffer.from(data) };
    });
    const files = await Promise.all(promises);

    let name = null;
    let kysofile = null;

    try {
      const _kysofile = await filebrowser.manager.services.contents.get('.kyso');
      kysofile = _kysofile.content;
    } catch (err) {
      // no kysofile
    }

    if (kysofile) {
      name = kysofile.split('/')[1].trim();
      const author = kysofile.split('/')[0].trim();
      if (author !== user.nickname) {
        name = prompt(`Name this study?\n(this was forked from ${author}/${name})`);
      }
    }

    if (!kysofile) {
      name = prompt('Name this study?');
      if (name) {
        const file = new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain' });
      }
    }

    if (!name) {
      this.setState({ busy: false });
      return; // the user cancelled the prompts
    }

    this.setState({ busy: true, name });
    try {
      await publish({
        name,
        main,
        user,
        files,
        apiUrl: config.API_URL,
        onProgress: ev => {
          this.setState({ progress: Math.round(ev.loaded * 100 / ev.total) });
        }
      });
    } catch (err) {
      this.setState({ progress: null, busy: false, published: false });
      if (err.response) {
        if (err.response.data.error) {
          return this.setState({ error: err.response.data.error });
        }
      }
      return this.setState({ error: 'An unknown error occurred.' });
    }

    if (name) {
      await filebrowser.upload(new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain' }));
      refreshMenuState();
    }
    return this.setState({ progress: null, busy: false, published: true });
  }

  render() {
    const { user } = this.props;
    const { items, name, error, progress, busy, published } = this.state;

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
              href: '#',
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
        React.createElement(
          'h2',
          null,
          'Publish ',
          name && 'an update',
          ' to Kyso'
        ),
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
        published && React.createElement(
          'p',
          null,
          React.createElement(
            'a',
            {
              target: '_blank',
              rel: 'noopener noreferrer',
              href: `https://kyso.io/${user.nickname}/${name}`
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
                href: '#',
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
                href: '#',
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