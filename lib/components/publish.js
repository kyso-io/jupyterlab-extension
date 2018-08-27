import React from 'react';
import ReactDOM from 'react-dom';
import Jupyter from '@kyso/react-jupyter';
import { VDomRenderer } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';

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

    window.filebrowser = this.filebrowser;

    this.state = {
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

  async startPublish(mainFile) {
    // we should loop over the files to see if there is a study.json
    // if not then create repo and write the study.json with the result
    // also need to ask for name for new study

    const isNew = true; // this needs to be a check for study.json

    // const files = await prepareFiles({
    //   files: this.state.items,
    //   filebrowser: this.filebrowser
    // })

    const name = prompt('Name this study?');

    const studyJSON = {
      name,
      author: this.props.user.nickname,
      main: mainFile
    };
  }

  render() {
    const {
      items, content, error
    } = this.state;

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
          'Publish to Kyso'
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