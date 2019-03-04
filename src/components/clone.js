import React from 'react'
import kyso from '@kyso/client'
import { URLExt } from '@jupyterlab/coreutils'
import { VDomRenderer } from '@jupyterlab/apputils'
import { ServerConnection } from '@jupyterlab/services'
import { FileBrowserModel } from '@jupyterlab/filebrowser'
import { Label, TextInput, Button, Pane, Text, Paragraph, Heading } from 'evergreen-ui'
import config from '../config'

export const LAUNCHER_CLASS = 'kyso-publish'

function httpRequest(url, method, data) {
  const fullRequest = {
    method,
    body: JSON.stringify(data)
  };

  const setting = ServerConnection.makeSettings()
  const fullUrl = URLExt.join(setting.baseUrl, url)
  return ServerConnection.makeRequest(fullUrl, fullRequest, setting)
}


export default class extends VDomRenderer {
  constructor(props) {
    super(props)
    this.addClass(LAUNCHER_CLASS)
    this.props = props
  }

  render() {
    return (
      <Component {...this.props} />
    )
  }
}

class Component extends React.Component {
  constructor(props) {
    super(props)
    this.props = props

    this.state = {
      studies: [],
      busy: false
    }
  }

  async componentDidMount() {
    const studies = await kyso.getStudies({
      token: this.props.user.sessionToken,
      apiUrl: config.API_URL
    })

    this.setState({ studies })

    this.filebrowser = new FileBrowserModel({
      manager: this.props.manager, // eslint-disable-line
      driveName: '',
      state: null
    })

    console.log(this.filebrowser, this.props.fileBrowserTracker)
  }

  getCwd() {
    return this.props.fileBrowserTracker.tracker.currentWidget.model.path // eslint-disable-line
  }

  async onSubmit(e) {
    const { user } = this.props
    e && e.preventDefault()
    let url = e.target.url.value

    if (url.startsWith('/')) {
      url = url.replace('/', '')
    }

    url = url.replace('https://', '')
    url = url.replace('http://', '')
    url = url.replace('kyso.io/', '')

    const [author, name] = url.split('/')

    this.setState({ busy: true })

    const study = await kyso.getStudy({
      author,
      name,
      token: this.props.user.sessionToken,
      apiUrl: config.API_URL
    })

    this.download(study)
  }

  async download(study) {
    const { user } = this.props
    const version = (study && study.versionsArray) ? study.versionsArray[0] : null

    if (!version) {
      return alert(`Study has no versions to download`)
    }

    try {
      this.setState({ busy: true })

      const args = {
        target_path: `${this.getCwd()}/${study.name}`,
        url: version.zip.url,
      }

      console.log(args)

      if (study.user.nickname === user.nickname) {
        args.update = `${user.nickname}/${study.name}`
      }

      const response = await httpRequest('/kyso/clone', 'POST', args)
      if (response.status !== 200) {
        const data = await response.json()
        // throw new ServerConnection.ResponseError(response, data.message)
        alert(data.message)
      }

      this.props.fileBrowserTracker.defaultBrowser.model.refresh()
      this.setState({ busy: false })
    } catch (err) {
      // throw ServerConnection.NetworkError
      console.error(err)
      alert('Network error while making download call')
      this.setState({ busy: false })
    }
  }

  render() {
    const { studies, busy } = this.state
    const { user, fileBrowserTracker } = this.props // eslint-disable-line

    return (
      <Pane className="jp-Launcher-body">
        <Pane className="jp-Launcher-content">
          <Pane paddingY={32}>
            <Pane maxWidth={600}>
              <Heading size={700} marginBottom={12}>
                Download Kyso study
              </Heading>

              <Pane>
                <form onSubmit={(e) => { this.onSubmit(e) }}>
                  <Label>Enter url of kyso study to download</Label>
                  <Pane display="flex">
                    <Pane>
                      <TextInput
                        name="url"
                        type="text"
                        placeholder="eg: eoin/getting-started-welcome-notebook"
                      />
                    </Pane>
                    <Pane>
                      <Button
                        isLoading={busy}
                      >
                        Download
                      </Button>
                    </Pane>
                  </Pane>

                  <Paragraph>
                    You may need to refresh the file browser
                  </Paragraph>
                </form>

              </Pane>
              <Pane marginTop={24}>

                <Heading size={700}>My studies</Heading>
                {studies.length > 0 && studies.map(study => (
                  <CloneButton
                    key={study.objectId}
                    study={study}
                    user={user}
                    fileBrowserTracker={fileBrowserTracker}
                  />
                ))}

                {studies.length === 0 && (
                  <p>loading...</p>
                )}
              </Pane>
            </Pane>
          </Pane>
        </Pane>
      </Pane>
    )
  }
}

class CloneButton extends Component {
  constructor(props) {
    super(props)
    this.props = props
    this.state = {
      busy: false
    }
  }

  componentDidMount() {}

  render() {
    const { busy } = this.state
    const { user, study } = this.props // eslint-disable-line

    return (
      <Pane
        marginTop={10}
        key={study.objectId}
      >
        <Button
          href="/clone"
          onClick={() => { this.download(study) }}
          intent="success"
          isLoading={busy}
          height={24}
          marginRight={12}
        >
          Download
        </Button>
        <Text>
          {study.user.nickname}/{study.name}{'  '}
        </Text>
      </Pane>
    )
  }
}
