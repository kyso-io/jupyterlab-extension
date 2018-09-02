import React from 'react'
import Jupyter from '@kyso/react-jupyter'
import { VDomRenderer } from '@jupyterlab/apputils'
import { FileBrowserModel } from '@jupyterlab/filebrowser'

export const LAUNCHER_CLASS = 'kyso-preview'

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

    this.state = {
      back: false,
      items: [],
      content: null,
      error: null
    }
  }

  componentDidMount() {
    this.filebrowser.refreshed.connect((fb) => {
      this.setState({
        items: sort(fb._items)
      })
    })

    this.filebrowser.refresh()
  }

  componentWillUnmount() {
    console.log('componentWillUnmount')
  }

  async onClick(item) {
    if (item.type === "notebook") {
      const file = await this.filebrowser.manager.services.contents.get(item.path)
      this.setState({
        content: file.content,
        error: null,
        back: false
      })
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
      content: null,
      error: null
    })
  }

  render() {
    const { back, items, content, error } = this.state
    return (
      <div className="jp-Launcher-body">
        <div className="jp-Launcher-content">
          <p>
            <a
              className="preview-link"
              style={{ marginLeft: '0px' }}
              href="#"
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
              {error}
            </p>
          )}

          {!content && items.length === 0 &&
            <p>No files</p>
          }

          {!content && items.length > 0 &&
            <div>
              <h2>Pick a Jupyter notebook to preview</h2>
              <p>It will look the same as it will when its published to Kyso</p>
            </div>
          }

          {!content && items.map(item => (
            <p key={item.name}>
              {item.type !== "notebook" && item.type !== "directory" && (
                <span>{item.name}</span>
              )}
              {item.type === "notebook" && (
                <span>
                  {item.name}{'  '}
                  <a
                    className="preview-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      this.onClick(item)
                    }}
                  >
                    Preview
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

          {content && (
            <Jupyter
              content={content}
              display="hidden"
            />
          )}
        </div>
      </div>
    )
  }
}
