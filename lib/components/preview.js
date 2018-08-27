import React from 'react';
import ReactDOM from 'react-dom';
import { VDomRenderer } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import Jupyter from '@kyso/react-jupyter';

export const LAUNCHER_CLASS = 'kyso-preview';

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
    ReactDOM.render(React.createElement(Component, this.props), this.node);
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

    this.state = {
      back: false,
      items: [],
      content: null,
      error: null
    };
  }

  componentDidMount() {
    this.filebrowser.refreshed.connect(fb => {
      this.setState({
        items: sort(fb._items)
      });
    });

    this.filebrowser.refresh();
  }

  async onClick(item) {
    console.log(item);
    if (item.type === "notebook") {
      const file = await this.filebrowser.manager.services.contents.get(item.path);
      this.setState({
        content: file.content,
        error: null,
        back: false
      });
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

  render() {
    const { back, items, content, error } = this.state;
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
          'Pick a Jupyter notebook to preview'
        ),
        React.createElement(
          'p',
          null,
          'It will look the same as it will when its published to Kyso'
        ),
        !content && items.map(item => React.createElement(
          'p',
          null,
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
                className: 'preview-link',
                onClick: e => {
                  e.preventDefault();
                  this.onClick(item);
                }
              },
              'Preview'
            )
          ),
          item.type === "directory" && React.createElement(
            'span',
            null,
            React.createElement(
              'a',
              {
                className: 'directory-link',
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