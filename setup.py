import setuptools
import json
from setupbase import (create_cmdclass, ensure_python, find_packages)

data_files_spec = [
    ('etc/jupyter/jupyter_notebook_config.d',
     'jupyter-config/jupyter_notebook_config.d', 'kyso_jupyterlab.json'),
]

cmdclass = create_cmdclass(data_files_spec=data_files_spec)

with open("README.md", "r") as fh:
    long_description = fh.read()

setup_dict = dict(
    name='kyso_jupyterlab',
    cmdclass=cmdclass,
    author='Git Intern Team, Noah Stapp, Jenna Landy, Alena Mueller',
    description="A server extension for JupyterLab's git extension",
    long_description=long_description,
    packages=find_packages(),
    install_requires=[
        'notebook'
    ],
    python_requires = '>=3.5',
    package_data={'kyso_jupyterlab': ['*']},
)


try:
    ensure_python(setup_dict["python_requires"].split(','))
except ValueError as e:
    raise  ValueError("{:s}, to use {} you must use python {} ".format(
                          e,
                          setup_dict["name"],
                          setup_dict["python_requires"])
                     )


f = open('./package.json', 'r')
pkg = json.loads(f.read())
f.close()

setuptools.setup(
    version=pkg['version'],
    **setup_dict
)
