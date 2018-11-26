"""
Module with all the individual handlers, which execute git commands and return the results to the frontend.
"""
import json
import os
from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import APIHandler
from tornado.web import HTTPError
import urllib.request
import zipfile
import string
import random

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

class Handler(APIHandler):
    """
    Top-level parent class.
    """

    @property
    def git(self):
        return self.settings["git"]


class KysoCloneHandler(Handler):
    def get(self):
        self.finish('kysoss')

    def post(self):
        """
        Handler for the `git clone`

        Input format:
            {
              'current_path': 'current_file_browser_path',
              'repo_url': 'https://github.com/path/to/myrepo'
            }
        """
        data = json.loads(self.request.body.decode('utf-8'))

        if 'url' not in data:
            raise HTTPError(status_code=400, log_message='Need argument: url')
            return

        if 'target_path' not in data:
            raise HTTPError(status_code=400, log_message='Need argument: target_path')
            return

        url = data['url']
        if data['target_path'].startswith('/'):
            target_path = os.path.join(self.settings['server_root_dir'], data['target_path'].replace('/', '', 1))
        else:
            target_path = os.path.join(self.settings['server_root_dir'], data['target_path'])
        if os.path.isdir(target_path):
            raise HTTPError(status_code=400, log_message='Folder %s already exists' % target_path)
            return

        zip_path = os.path.join('/tmp', id_generator() + '.zip')

        urllib.request.urlretrieve(url, zip_path)

        zip_ref = zipfile.ZipFile(zip_path, 'r')
        zip_ref.extractall(target_path)
        zip_ref.close()

        update = False
        if 'update' in data:
            update = data['update']

            file = open(os.path.join(target_path, '.kyso'), 'w')
            file.write(update)
            file.close()

        self.finish('finished')

def setup_handlers(web_app):
    """
    Setups all of the git command handlers.
    Every handler is defined here, to be used in git.py file.
    """

    handlers = [
        ("/kyso/clone", KysoCloneHandler),
    ]

    # add the baseurl to our paths
    base_url = web_app.settings["base_url"]
    handlers = [(ujoin(base_url, x[0]), x[1]) for x in handlers]
    web_app.add_handlers(".*", handlers)
