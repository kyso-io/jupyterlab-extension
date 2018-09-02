import React from 'react';
import JSZip from 'jszip';
import crypto from 'crypto-js';
import Jupyter from '@kyso/react-jupyter';
import { publish, str2buf } from '@kyso/publish';
import { VDomRenderer } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';

export const LAUNCHER_CLASS = 'kyso-open-study';

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
      error: null
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
      content: null,
      error: null
    });
  }

  async startPublish(main) {
    const promises = this.state.items.map(async item => {
      const file = await this.filebrowser.manager.services.contents.get(item.path);
      const data = file.format === 'json' ? file.content : JSON.stringify(file.content, null, 2);
      return { path: file.path, data: str2buf(data) };
    });

    const files = await Promise.all(promises);

    const user = this.props.user;
    let name = null;
    let kysofile = null;

    try {
      const _kysofile = await this.filebrowser.manager.services.contents.get('.kyso');
      kysofile = _kysofile.content;
    } catch (err) {
      // no kysofile
    }

    if (kysofile) {
      console.log(kysofile);
      name = kysofile.split('/')[1].trim();
      const author = kysofile.split('/')[0].trim();
      if (author !== user.nickname) {
        name = prompt(`Name this study?\n(forked from ${author}/${name})`);
        if (name) {
          await this.filebrowser.upload(new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain' }));
        }
      }
    }

    if (!kysofile) {
      name = prompt('Name this study?');
      if (name) {
        const file = new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain' });
        await this.filebrowser.upload(new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain' }));
      }
    }

    if (!name) return; // the user cancelled the prompts

    console.log({
      name,
      main,
      user: this.props.user,
      files,
      apiUrl: 'https://staging.api.kyso.io'
    });

    // publish({
    //   name,
    //   main,
    //   user: this.props.user,
    //   files,
    //   apiUrl: 'https://staging.api.kyso.io'
    // })
  }

  render() {
    const { user } = this.props;
    const { items, content, name, error } = this.state;

    return React.createElement(
      'div',
      { className: 'jp-Launcher-body' },
      React.createElement(
        'div',
        { className: 'jp-Launcher-content' },
        React.createElement(
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
        error && React.createElement(
          'p',
          null,
          error
        ),
        React.createElement(
          'h2',
          null,
          'Publish ',
          name && 'an update',
          ' to Kyso'
        ),
        name && React.createElement(
          'p',
          null,
          'This study is publshed on Kyso (',
          React.createElement(
            'a',
            {
              target: '_blank',
              rel: 'noopener noreferrer',
              href: `https://kyso.io/${user.nickname}/${name}`
            },
            `${user.nickname}/${name}`
          ),
          ')'
        ),
        React.createElement(
          'p',
          null,
          'Choose which notebook will be the main notebook displayed on Kyso (don',
          "'",
          't worry all files will be included in a reproducible repository on Kyso).'
        ),
        !content && items.map(item => React.createElement(
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
        )),
        content && React.createElement(Jupyter, {
          content: content,
          display: 'hidden'
        })
      )
    );
  }
}