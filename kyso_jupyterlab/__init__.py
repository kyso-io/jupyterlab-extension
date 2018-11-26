"""
Initialize the backend server extension
"""
from kyso_jupyterlab.handlers import setup_handlers


def _jupyter_server_extension_paths():
    """
    Declare the Jupyter server extension paths.
    """
    return [{"module": "kyso_jupyterlab"}]


def _jupyter_nbextension_paths():
    """
    Declare the Jupyter notebook extension paths.
    """
    return [{"section": "notebook", "dest": "kyso_jupyterlab"}]


def load_jupyter_server_extension(nbapp):
    """
    Load the Jupyter server extension.
    """
    setup_handlers(nbapp.web_app)
