var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import React from 'react';
import kyso from '@kyso/client';
import { URLExt } from '@jupyterlab/coreutils';
import { VDomRenderer } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import config from '../config';
import { getUser } from '../utils/auth';

export const LAUNCHER_CLASS = 'kyso-publish';

function httpRequest(url, method, data) {
  const fullRequest = {
    method,
    body: JSON.stringify(data)
  };

  const setting = ServerConnection.makeSettings();
  const fullUrl = URLExt.join(setting.baseUrl, url);
  return ServerConnection.makeRequest(fullUrl, fullRequest, setting);
}

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

    this.state = {
      studies: [],
      busy: false
    };
  }

  async componentDidMount() {
    const studies = await kyso.getStudies({
      token: this.props.user.sessionToken,
      apiUrl: config.API_URL
    });

    this.setState({ studies });
  }

  getCwd() {
    return this.props.fileBrowserTracker.tracker.currentWidget.model.path; // eslint-disable-line
  }

  async onSubmit(e) {
    const { user } = this.props;
    e.preventDefault();
    let url = e.target.url.value;

    if (url.startsWith('/')) {
      url = url.replace('/', '');
    }

    url = url.replace('https://', '');
    url = url.replace('http://', '');
    url = url.replace('kyso.io/', '');

    const [author, name] = url.split('/');

    this.setState({ busy: true });

    const study = await kyso.getStudy({
      author,
      name,
      token: this.props.user.sessionToken,
      apiUrl: config.API_URL
    });

    this.download(study);
  }

  async download(study) {
    const { user } = this.props;
    const version = study && study.versionsArray ? study.versionsArray[0] : null;

    if (!version) {
      return alert(`Study has no versions to download`);
    }

    try {
      this.setState({ busy: true });

      const args = {
        target_path: `${this.getCwd()}/${study.name}`,
        url: version.zip.url
      };

      if (study.user.nickname === user.nickname) {
        args.update = `${user.nickname}/${study.name}`;
      }

      const response = await httpRequest('/kyso/clone', 'POST', args);
      if (response.status !== 200) {
        const data = await response.json();
        // throw new ServerConnection.ResponseError(response, data.message)
        alert(data.message);
      }

      setTimeout(() => {
        this.setState({ busy: false });
      }, 2500);
    } catch (err) {
      // throw ServerConnection.NetworkError
      console.error(err);
      alert('Network error while making download call');
      this.setState({ busy: false });
    }
  }

  render() {
    const { studies, busy } = this.state;
    const { user, fileBrowserTracker } = this.props; // eslint-disable-line

    return React.createElement(
      'div',
      { className: 'jp-Launcher-body' },
      React.createElement(
        'div',
        { className: 'jp-Launcher-content' },
        React.createElement(
          'h3',
          null,
          'Enter url of kyso study to download'
        ),
        React.createElement(
          'form',
          {
            onSubmit: e => {
              this.onSubmit(e);
            }
          },
          React.createElement('input', {
            className: 'name-input',
            name: 'url',
            type: 'text'
          }),
          React.createElement('input', {
            className: 'name-submit',
            type: 'submit',
            value: busy ? 'Downloading...' : 'Download'
          })
        ),
        React.createElement(
          'h3',
          null,
          'My studies'
        ),
        studies.length > 0 && studies.map(study => React.createElement(CloneButton, {
          key: study.objectId,
          study: study,
          user: user,
          fileBrowserTracker: fileBrowserTracker
        })),
        studies.length === 0 && React.createElement(
          'p',
          null,
          'loading...'
        )
      )
    );
  }
}

class CloneButton extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      busy: false
    };
  }

  render() {
    const { busy } = this.state;
    const { user, study } = this.props; // eslint-disable-line

    return React.createElement(
      'div',
      {
        style: { marginTop: '10px' },
        key: study.objectId
      },
      React.createElement(
        'a',
        {
          href: '/clone',
          className: 'clone-link',
          onClick: e => {
            e.preventDefault();
            this.download(study);
          }
        },
        busy ? 'Downloading...' : 'Download'
      ),
      React.createElement(
        'span',
        null,
        study.user.nickname,
        '/',
        study.name,
        '  '
      )
    );
  }
}