# jupyterlab-kyso

[https://gitter.im/jupyterlab/jupyterlab](https://gitter.im/jupyterlab/jupyterlab)
https://github.com/Ramshackle-Jamathon/react-oauth-popup
https://medium.com/front-end-hacking/use-github-oauth-as-your-sso-seamlessly-with-react-3e2e3b358fa1
## Prerequisites

* JupyterLab 0.31
* A Kyso account

## Installation

To install this extension into JupyterLab (requires node 5 or later), do the following:

```bash
jupyter labextension install @jupyterlab/kyso
```

## Development

For a development install, do the following in the repository directory:

```bash
pipenv install
```

```bash
pipenv shell
yarn
yarn run build
jupyter labextension install . --no-build
yarn run watch
```

```bash
pipenv shell
# and in another shell
jupyter lab --watch
```

## Saving studies

This plugin uses the [@kyso/publish](https://github.com/kyso-io/kyso-publish)
to publish the directory to Kyso. But this repo will be responsible for saving the
author and studyname in a hidden file called .kyso in the form author/studyname
