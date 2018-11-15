/* global window */
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import config from '../config';

const execute = props => async () => {
  const { manager } = props;
  const filebrowser = new FileBrowserModel({
    manager,
    driveName: '',
    state: null
  });

  let kysofile = null;
  try {
    const _kysofile = await filebrowser.manager.services.contents.get('.kyso');
    kysofile = _kysofile.content;
  } catch (err) {
    // console.error(err)
    // no kysofile
  }

  if (kysofile) {
    const author = kysofile.split('/')[0].trim();
    if (author === props.user.nickname) {
      window.open(`${config.UI_URL}/${author}/${kysofile.split('/')[1].trim()}`, '_blank');
    }
  }
};

const command = props => ({
  label: 'View on Kyso ',
  execute: execute(props)
});

export default command;