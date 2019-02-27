# jupyterlab-kyso

## Prerequisites

* JupyterLab 0.35 or more
* A Kyso account

## Installation

Check your version of Jupyterlab using the following command

```bash
jupyter-lab --version
0.35.2
```

### JupyterLab 0.35 or above

To install this extension into JupyterLab (requires node 5 or later), do the following:

```bash
jupyter labextension install @kyso/jupyterlab
pip install kyso_jupyterlab
jupyter serverextension enable --sys-prefix kyso_jupyterlab
```

## Development

For a development install, do the following in the repository directory:

```bash
yarn
yarn run build
jupyter labextension install . --no-build
yarn run watch
```

```bash
# and in another shell
jupyter lab --watch
```

## Deployment


To publish the client side extension:

```
npm publish
```

To publish the server side extension:

```
python3 setup.py sdist
twine upload dist/*
```
