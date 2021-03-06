var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import { toArray } from '@phosphor/algorithm';
import Clone from '../components/clone';

const Private = {
  id: 0
};

const execute = props => args => {
  const { shell } = props;
  const id = `publish-${Private.id + 1}`;

  const launcher = new Clone(_extends({}, props));

  launcher.id = id;
  launcher.title.label = 'Kyso Clone';
  launcher.title.iconClass = 'jp-LauncherIcon';
  launcher.title.closable = !!toArray(props.shell.widgets('main')).length;

  shell.addToMainArea(launcher);
  if (args.activate !== false) {
    shell.activateById(launcher.id);
  }

  shell.layoutModified.connect(() => {
    // If there is only a launcher open, remove the close icon.
    launcher.title.closable = toArray(shell.widgets('main')).length > 1;
  }, launcher);

  return launcher;
};

const command = props => ({
  label: 'Download study from Kyso',
  execute: execute(props)
});

export default command;