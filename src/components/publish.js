/* global File */
import React from 'react'
import { Line } from 'rc-progress'
import Spinner from 'react-spinkit'
import kyso from '@kyso/client'
import prepareFiles from '@kyso/client/utils/prepare-files'
import { VDomRenderer } from '@jupyterlab/apputils'
import { FileBrowserModel } from '@jupyterlab/filebrowser'
import config from '../config'
import { getUser } from '../utils/auth'

const slugPattern = new RegExp('^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$')

export const LAUNCHER_CLASS = 'kyso-publish'

const flatten = (arr) =>
  arr.reduce((flat, toFlatten) =>
    flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten)
  , [])

const sort = (items) => {
  const notebooks = items.filter(i => i.type === "notebook")
  const directories = items.filter(i => i.type === "directory")
  const files = items.filter(i => i.type !== "notebook" && i.type !== "directory")
  return [].concat(directories, notebooks, files)
}

const getName = (msg) => {
  let name = prompt(msg) // eslint-disable-line

  if (!name) return false

  if (!slugPattern.test(name)) {
    alert(`Study name can only consist of letters, numbers, '_' and '-'. ${name} didnt match.`) // eslint-disable-line
    return null
  }

  name = name.toString().toLowerCase() // eslint-disable-line
    .replace(/\s+/g, '-')     // Replace spaces with
    .replace(/[^\w\-]+/g, '') // eslint-disable-line
    .replace(/\-\-+/g, '-')   // eslint-disable-line
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '')

  return name
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
    this.props = {
      user: getUser(),
      ...props,
    }

    this.filebrowser = new FileBrowserModel({
      manager: props.manager, // eslint-disable-line
      driveName: '',
      state: null
    })

    this.state = {
      items: [],
      content: null,
      error: null,
      busy: false,
      published: false,
      progress: null,
      size: 0
    }
  }

  async componentDidMount() {
    const kysofile = await this.getKysoFile()
    if (kysofile) {
      const author = kysofile.split('/')[0].trim()
      if (author === this.props.user.nickname) {
        this.setState({ name: kysofile.split('/')[1].trim(), hasKysoFile: true })
      }
    }

    const manager = this.props.manager
    const fetchItems = async (path) => {
      const contents = await manager.services.contents.get(path)
      const funcs = contents.content.map((item) => {
        if (item.type !== 'directory') return item
        return fetchItems(item.path)
      })
      return Promise.all(funcs)
    }

    const items = await fetchItems(this.getCwd())
    this.setState({
      items: flatten(sort(items))
    })
  }

  onClick(item) {
    if (item.type === 'notebook') {
      this.startPublish(item.path)
    } else if (item.type === 'directory') {
      this.cd(item)
    } else {
      this.setState({ error: 'whoops! Not a jupyter notebook' })
    }
  }

  async getKysoFile() {
    try {
      const _kysofile = await this.filebrowser.manager.services.contents.get(
        `${this.getCwd()}/.kyso`
      )
      const kysofile = _kysofile.content
      return kysofile
    } catch (err) {
      // no kysofile
      return null
    }
  }

  getCwd() {
    return this.props.fileBrowserTracker.tracker.currentWidget.model.path // eslint-disable-line
  }

  back() {
    this.cd({ name: ".." })
  }

  cd(item) {
    this.filebrowser.cd(item.name)
    this.setState({ error: null })
  }

  async startPublish(main) {
    this.setState({ busy: true, progress: null })
    const { items } = this.state
    const { user, refreshMenuState } = this.props
    const filebrowser = this.filebrowser

    let { name } = this.state
    const kysofile = await this.getKysoFile()

    if (kysofile) {
      if (!name) {
        name = kysofile.split('/')[1].trim()
      }

      const author = kysofile.split('/')[0].trim()
      if (author !== user.nickname) {
        if (!name) {
          name = getName(`Name this study?\n(this was forked from ${author}/${name})`)
          if (!name) return this.setState({ busy: false })
        }
      }
    }

    if (!kysofile) {
      if (!name) {
        name = getName('Name this study?') // eslint-disable-line
        if (!name) return this.setState({ busy: false })
      }

      const existingStudy = await kyso.getStudy({
        token: user.sessionToken,
        author: user.nickname,
        name,
        apiUrl: config.API_URL
      })

      if (existingStudy) {
        const y = confirm(`Study ${name} already exists, do you want to push an update to it?`) // eslint-disable-line
        if (!y) {
          name = null
        }
      }
    }

    if (!name) {
      this.setState({ busy: false })
      return // the user cancelled the prompts
    }

    console.log({ items })

    const promises = items.map(async (item) => {
      const file = await filebrowser.manager.services.contents.get(item.path)
      const data = file.format === 'json' ? JSON.stringify(file.content) : file.content
      return { path: file.path, data: kyso.Buffer.from(data) }
    })
    const files = await Promise.all(promises)

    const size = files.reduce((acc, curr) => acc + curr.data.length, 0)

    this.setState({ busy: true, name, size })

    console.log({ files })
    const { zip, fileMap, versionHash } = await prepareFiles(files)
    console.log({ zip, fileMap, versionHash })

    try {
      await kyso.publish({
        name,
        main,
        token: user.sessionToken,
        files,
        apiUrl: config.API_URL,
        onProgress: (ev) => {
          this.setState({ progress: Math.round((ev.loaded * 100) / ev.total) })
        }
      })
    } catch (err) {
      console.error(err)
      this.setState({ progress: null, busy: false, published: false })
      if (err.message) {
        return this.setState({ error: err.message })
      }
      return this.setState({ error: 'An unknown error occurred.' })
    }

    if (name) {
      await filebrowser.upload(
        new File([`${user.nickname}/${name}`],
          `.kyso`,
          { type: 'text/plain' }
        )
      )
      refreshMenuState()
    }
    return this.setState({ progress: null, busy: false, published: true })
  }

  render() {
    const { items, name, size, error, hasKysoFile, progress, busy, published } = this.state
    const { user } = this.props // eslint-disable-line

    const i = Math.floor(Math.log(size) / Math.log(1024))
    const readableSize = (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i] // eslint-disable-line

    return (
      <div className="jp-Launcher-body">
        <div className="jp-Launcher-content">

          {!error && !published && !busy &&
            <p>
              <a
                className="preview-link"
                href="/preview-link"
                style={{ marginLeft: '0px' }}
                onClick={(e) => {
                  e.preventDefault()
                  this.back()
                }}
              >
                {'<'} back
              </a>
            </p>
          }

          {!name && (
            <h2>Publish to Kyso</h2>
          )}

          {name && (
            <h2>
              {hasKysoFile && 'Publishing an update of '}
              {!hasKysoFile && 'Publishing new study: '}
              {'  '}
              <a
                href={`${config.UI_URL}/${user.nickname}/${name}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                {user.nickname}/{name}
              </a>
            </h2>
          )}

          {published &&
            <p>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${config.UI_URL}/${user.nickname}/${name}`}
              >
                View {`${user.nickname}/${name}`} on Kyso
              </a>
            </p>
          }

          {!error && !published && !busy && <p>
            Choose which notebook will be the main notebook displayed on Kyso (don{"'"}t worry all files will
            be included in a reproducible repository on Kyso).
          </p>}

          <p>Directory: {this.getCwd()}/</p>
          <br />

          {error && (
            <p>
              <strong>{error}</strong>
            </p>
          )}

          {busy && !progress &&
            <div>
              <Spinner name="circle" fadeIn="none" />
            </div>
          }

          {progress &&
            <div>
              Uploading, size:{'  '}{readableSize}
              <br />
              <Line percent={progress.toString()} /> {`${progress}%`}
            </div>
          }

          {!error && !published && !busy && (
            <div>
              <p>Study name {hasKysoFile && `(leave blank to update current study ${name})`}:</p>
              <input
                className="name-input"
                value={name || ''}
                onChange={(e) => {
                  this.setState({ name: e.target.value })
                }}
                type="text"
              />
            </div>
          )}

          {!error && !published && !busy && items.map(item => (
            <p key={item.path}>
              {item.type !== "notebook" && item.type !== "directory" && (
                <span

                >{item.path}</span>
              )}
              {item.type === "notebook" && (
                <span>
                  <span>
                    {item.path}{'  '}
                  </span>
                  <a
                    href="/preview-link"
                    className="preview-link"
                    onClick={(e) => {
                      e.preventDefault()
                      this.onClick(item)
                    }}
                  >
                    Select as main
                  </a>
                </span>
              )}
              {item.type === "directory" && (
                <span>
                  <a
                    className="directory-link"
                    href="/directory-link"
                    onClick={(e) => {
                      e.preventDefault()
                      this.onClick(item)
                    }}
                  >
                    {item.path}/
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
