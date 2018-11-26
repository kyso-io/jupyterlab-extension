"""
Setup module for the jupyterlab_github proxy extension
"""
from setuptools import setup, find_packages
import json
from setupbase import (
    create_cmdclass, ensure_python, find_packages
    )

data_files_spec = [
    ('etc/jupyter/jupyter_notebook_config.d',
     'jupyter-config/jupyter_notebook_config.d', 'kyso_jupyterlab.json'),
]

cmdclass = create_cmdclass(data_files_spec=data_files_spec)

with open("README.md", "r") as fh:
    long_description = fh.read()

f = open('./package.json', 'r')
pkg = json.loads(f.read())
f.close()

setup(
    name='kyso_jupyterlab',
    version=pkg['version'],
    cmdclass=cmdclass,
    author='Git Intern Team, Noah Stapp, Jenna Landy, Alena Mueller',
    description="A server extension for JupyterLab's git extension",
    long_description=long_description,
    packages=find_packages(),
    install_requires=[
        'notebook'
    ],
    package_data={'kyso_jupyterlab': ['*']},
)
