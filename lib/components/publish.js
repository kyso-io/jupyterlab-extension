/* global File */
import React from 'react';
import kyso from '@kyso/client';
import { Base64 } from 'js-base64';
import { Line } from 'rc-progress';
import Spinner from 'react-spinkit';
import { VDomRenderer } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { Link, TextInputField, Button, Pane, Text, Paragraph, Heading } from 'evergreen-ui';
import config from '../config';

const slugPattern = new RegExp('^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$');

export const LAUNCHER_CLASS = 'kyso-publish';

const flatten = arr => arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), []);

const sort = items => {
  const notebooks = items.filter(i => i.type === "notebook");
  const directories = items.filter(i => i.type === "directory");
  const files = items.filter(i => i.type !== "notebook" && i.type !== "directory");
  return [].concat(directories, notebooks, files);
};

const getName = msg => {
  let name = prompt(msg); // eslint-disable-line
  if (!name) return false;
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
    this.filebrowser = new FileBrowserModel({
      manager: props.manager, // eslint-disable-line
      driveName: '',
      state: null
    });

    this.state = {
      items: [],
      content: null,
      error: null,
      team: props.team || null,
      busy: false,
      published: false,
      progress: null,
      size: 0
    };
  }

  async componentDidMount() {
    const { team, user, manager } = this.props;
    const kysofile = await this.getKysoFile();
    if (kysofile) {
      const author = kysofile.split('/')[0].trim();
      if (team && author === team) {
        this.setState({ name: kysofile.split('/')[1].trim(), hasKysoFile: kysofile });
      }
      if (!team && author === user.nickname) {
        this.setState({ name: kysofile.split('/')[1].trim(), hasKysoFile: kysofile });
      }
    }

    const fetchItems = async path => {
      const contents = await manager.services.contents.get(path);
      const funcs = contents.content.map(item => {
        if (item.type !== 'directory') return item;
        return fetchItems(item.path);
      });
      return Promise.all(funcs);
    };

    const items = await fetchItems(this.getCwd());
    this.setState({
      items: flatten(sort(items))
    });
  }

  onClick(item) {
    if (item.type !== 'directory') {
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
    const { user, team, refreshMenuState } = this.props;
    const filebrowser = this.filebrowser;

    const cwd = this.getCwd();

    let { name } = this.state;
    const kysofile = await this.getKysoFile();

    let teamnames = [];
    if (user.teams) {
      teamnames = user.teams.map(team => team.name);
    }

    if (kysofile) {
      if (!name) {
        name = kysofile.split('/')[1].trim();
      }

      const author = kysofile.split('/')[0].trim();
      if (author !== user.nickname && !teamnames.includes(author)) {
        if (!name) {
          name = getName(`Name this study?\n(this was forked from ${author}/${name})`);
          if (!name) return this.setState({ busy: false });
        }
      }
    }

    if (!kysofile) {
      if (!name) {
        name = getName('Name this study?'); // eslint-disable-line
        if (!name) return this.setState({ busy: false });
      }

      const existingStudy = await kyso.getStudy({
        token: user.sessionToken,
        author: user.nickname,
        name,
        team,
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

      let path = file.path;
      if (cwd && cwd !== '/') {
        path = file.path.replace(`${cwd}/`, '');
      }

      if (file.format === "base64") {
        return { path, data };
      }

      return { path, data: Base64.encode(data) };
    });

    const files = await Promise.all(promises);

    const size = files.reduce((acc, curr) => acc + curr.data.length, 0);

    this.setState({ busy: true, name, size });
    // const { zip, fileMap, versionHash } = await prepareFiles(files, { base64: true })
    // saveAs(zip, "kyso.zip")
    // console.log({
    //   zip,
    //   fileMap,
    //   versionHash,
    //   main: main.replace(`${cwd}/`, ''),
    //   files,
    //   cwd
    // })

    try {
      await kyso.publish({
        name,
        main: main.replace(`${cwd}/`, ''),
        token: user.sessionToken,
        files,
        team,
        zipOpts: { base64: true },
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

    if (name) {
      let n = `${user.nickname}/${name}`;
      if (team) n = `${team}/${name}`;
      const f = new File([n], `${cwd}/.kyso`, { type: 'text/plain' });
      await filebrowser.upload(f);
      refreshMenuState();
    }
    return this.setState({ progress: null, busy: false, published: true });
  }

  render() {
    const { items, name, team, size, error, hasKysoFile, progress, busy, published } = this.state;
    const { user } = this.props; // eslint-disable-line

    const i = Math.floor(Math.log(size) / Math.log(1024));
    const readableSize = (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]; // eslint-disable-line

    return React.createElement(
      Pane,
      { className: 'jp-Launcher-body' },
      React.createElement(
        Pane,
        { className: 'jp-Launcher-content' },
        React.createElement(
          Pane,
          { paddingY: 32 },
          React.createElement(
            Pane,
            { maxWidth: 600 },
            React.createElement(
              Heading,
              { size: 700 },
              !name && !hasKysoFile && !team && 'Publish to Kyso',
              !name && !hasKysoFile && team && `Publish to your team: ${team}`,
              !name && hasKysoFile && `Publishing an update of ${hasKysoFile}`,
              name && !hasKysoFile && 'Publishing new study: '
            ),
            name && hasKysoFile && React.createElement(
              Link,
              {
                display: 'inline-block',
                href: `${config.UI_URL}/${team || user.nickname}/${name}`,
                rel: 'noopener noreferrer',
                target: '_blank',
                textDecoration: 'none'
              },
              React.createElement(
                Heading,
                { size: 700 },
                'Publishing an update of ',
                team || user.nickname,
                '/',
                name
              )
            ),
            published && React.createElement(
              Paragraph,
              null,
              React.createElement(
                Link,
                {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  href: `${config.UI_URL}/${team || user.nickname}/${name}`
                },
                'View ',
                `${team || user.nickname}/${name}`,
                ' on Kyso'
              )
            ),
            !error && !published && !busy && React.createElement(
              Paragraph,
              { maxWidth: 600 },
              'Choose which notebook will be the main notebook displayed on Kyso (don',
              "'",
              't worry all files will be included in a reproducible repository on Kyso).'
            ),
            React.createElement(
              Paragraph,
              null,
              'Directory: ',
              this.getCwd(),
              '/'
            ),
            error && React.createElement(
              Paragraph,
              null,
              error
            ),
            busy && !progress && React.createElement(
              Pane,
              null,
              React.createElement(Spinner, { name: 'circle', fadeIn: 'none' })
            ),
            progress && React.createElement(
              Pane,
              null,
              React.createElement(
                Text,
                null,
                'Uploading, size:',
                '  ',
                readableSize
              ),
              React.createElement(Line, { percent: progress.toString() }),
              ' ',
              `${progress}%`
            ),
            !error && !published && !busy && React.createElement(TextInputField, {
              marginTop: 24,
              label: 'Study name',
              description: hasKysoFile ? "Don't change if you want to update the current study" : "",
              placeholder: 'Study name',
              value: name || '',
              onChange: e => {
                this.setState({ name: e.target.value });
              }
            })
          ),
          React.createElement(
            Pane,
            null,
            !error && !published && !busy && items.map(item => React.createElement(
              Pane,
              { key: item.path },
              item.type !== "directory" && React.createElement(
                Pane,
                null,
                React.createElement(
                  Button,
                  {
                    href: '/preview-link',
                    onClick: () => {
                      this.onClick(item);
                    },
                    appearance: 'minimal',
                    intent: 'success',
                    iconBefore: 'circle',
                    marginRight: 12
                  },
                  'Set as main'
                ),
                React.createElement(
                  Text,
                  null,
                  item.path
                )
              )
            ))
          )
        )
      )
    );
  }
}