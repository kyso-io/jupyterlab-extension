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

## Auth

Auth is done by saving a string of json in a localStorage variable called 'user'. Retrieve it with:

```javascript
JSON.parse(localStorage.getItem('user'))
```

set it with:

```javascript
localStorage.setItem('user', JSON.stringify(user))
```

```bash
sudo jupyter lab --watch --ip=* --allow-root
> node /Users/eoinmurray/.local/share/virtualenvs/jupyterlab-kyso-dg6Lf56k/lib/python3.5/site-packages/jupyterlab/staging/yarn.js install
> ✨  Done in 103.64s.
> node /Users/eoinmurray/.local/share/virtualenvs/jupyterlab-kyso-dg6Lf56k/lib/python3.5/site-packages/jupyterlab/staging/yarn.js run watch
> node /Users/eoinmurray/.local/share/virtualenvs/jupyterlab-kyso-dg6Lf56k/lib/python3.5/site-packages/jupyterlab/staging/yarn.js install
> ✨  Done in 107.44s.
> node /Users/eoinmurray/.local/share/virtualenvs/jupyterlab-kyso-dg6Lf56k/lib/python3.5/site-packages/jupyterlab/staging/yarn.js run watch
```
