/* global window */
import config from '../config';

const execute = () => async () => {
  window.open(config.UI_URL, '_blank');
};

const command = props => ({
  label: 'Open my Kyso ',
  execute: execute(props)
});

export default command;