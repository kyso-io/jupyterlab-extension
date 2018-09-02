import React from 'react'
import JSZip from 'jszip'
import crypto from 'crypto-js'
import Spinner from 'react-spinkit'
import { publish, Buffer } from '@kyso/publish'
import { VDomRenderer } from '@jupyterlab/apputils'
import { FileBrowserModel } from '@jupyterlab/filebrowser'
import config from '../config.js'

export const LAUNCHER_CLASS = 'kyso-publish'

const sort = (items) => {
  const notebooks = items.filter(i => i.type === "notebook")
  const directories = items.filter(i => i.type === "directory")
  const files = items.filter(i => i.type !== "notebook" && i.type !== "directory")
  return [].concat(directories, notebooks, files)
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
    const { manager } = this.props
    this.filebrowser = new FileBrowserModel({
      manager,
      driveName: '',
      state: null
    })

    window.filebrowser = this.filebrowser

    this.state = {
      items: [],
      content: null,
      error: null,
      busy: false,
      published: false
    }
  }

  async componentDidMount() {
    let kysofile = null
    try {
      const _kysofile = await this.filebrowser.manager.services.contents.get('.kyso')
      kysofile = _kysofile.content
    } catch (err) {
      // no kysofile
    }

    if (kysofile) {
      const author = kysofile.split('/')[0].trim()
      if (author ===  this.props.user.nickname) {
        this.setState({ name: kysofile.split('/')[1].trim() })
      }
    }

    this.filebrowser.refreshed.connect((fb) => {
      this.setState({
        items: sort(fb._items)
      })
    })

    this.filebrowser.refresh()
  }

  async onClick(item) {
    if (item.type === "notebook") {
      this.startPublish(item.path)
    } else if (item.type === "directory") {
      this.cd(item)
    } else {
      this.setState({
        error: 'whoops! Not a jupyter notebook'
      })
    }
  }

  async back() {
    this.cd({ name: ".." })
  }

  async cd(item) {
    this.filebrowser.cd(item.name)
    this.setState({
      error: null
    })
  }

  async startPublish(main) {
    const { items } = this.state
    const { user } = this.props
    const filebrowser = this.filebrowser

    const promises = items.map(async (item) => {
      const file = await filebrowser.manager.services.contents.get(item.path)
      const data = file.format === 'json' ? JSON.stringify(file.content) : file.content
      return { path: file.path, data: Buffer.from(data) }
    })
    const files = await Promise.all(promises)

    let name = null
    let kysofile = null

    try {
      const _kysofile = await filebrowser.manager.services.contents.get('.kyso')
      kysofile = _kysofile.content
    } catch (err) {
      // no kysofile
    }

    if (kysofile) {
      name = kysofile.split('/')[1].trim()
      const author = kysofile.split('/')[0].trim()
      if (author !==  user.nickname) {
        name = prompt(`Name this study?\n(forked from ${author}/${name})`)
      }
    }

    if (!kysofile) {
      name = prompt('Name this study?')
      if (name) {
        const file = new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain', })
      }
    }

    if (!name) return // the user cancelled the prompts

    this.setState({ busy: true, name })
    try {
      await publish({
        name,
        main,
        user,
        files,
        apiUrl: config.API_URL
      })
    } catch (err) {
      this.setState({ busy: false, published: false })
      if(err.response) {
        if (err.response.data.error) {
          return this.setState({ error: err.response.data.error })
        }
      }
      return this.setState({ error: 'An unknown error occurred.' })
    }

    if (name) {
      await filebrowser.upload(
        new File([`${user.nickname}/${name}`], '.kyso', { type: 'text/plain', })
      )
    }
    return this.setState({ busy: false, published: true })
  }

  render() {
    const { user } = this.props
    const { items, name, error, busy, published } = this.state

    return (
      <div className="jp-Launcher-body">
        <div className="jp-Launcher-content">
          <p>
            <a
              className="preview-link"
              href="#"
              style={{ marginLeft: '0px' }}
              onClick={(e) => {
                e.preventDefault()
                this.back()
              }}
            >
              {'<'} back
            </a>
          </p>

          {error && (
            <p>
              <strong>{error}</strong>
            </p>
          )}

          <h2>Publish {name && 'an update'} to Kyso</h2>

          {busy &&
            <div>
              <Spinner name="circle" fadeIn="none" /> Publishing...
            </div>
          }

          {published &&
            <p>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://kyso.io/${user.nickname}/${name}`}
                >
                  View {`${user.nickname}/${name}`} on Kyso
                </a>
            </p>
          }

          {name && !published &&
            <p>
              This study is published on Kyso (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://kyso.io/${user.nickname}/${name}`}
                >
                  {`${user.nickname}/${name}`}
                </a>
              )
            </p>
          }

          {!published && !busy && <p>
            Choose which notebook will be the main notebook displayed on Kyso (don{"'"}t worry all files will
            be included in a reproducible repository on Kyso).
          </p>}
          {!published && !busy && items.map(item => (
            <p key={item.name}>
              {item.type !== "notebook" && item.type !== "directory" && (
                <span>{item.name}</span>
              )}
              {item.type === "notebook" && (
                <span>
                  {item.name}{'  '}
                  <a
                    href="#"
                    className="preview-link"
                    onClick={(e) => {
                      e.preventDefault()
                      this.onClick(item)
                    }}
                  >
                    Select
                  </a>
                </span>
              )}
              {item.type === "directory" && (
                <span>
                  <a
                    className="directory-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      this.onClick(item)
                    }}
                  >
                    {item.name}/
                  </a>
                </span>
              )}
            </p>
          ))}
        </div>
      </div>
    )
  }
}
