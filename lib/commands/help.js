/* global window */

const execute = () => async () => {
  window.open(`https://github.com/kyso-io/jupyterlab-extension`, '_blank');
};

const command = props => ({
  label: 'View @kyso/jupyterlab on Github',
  execute: execute(props)
});

export default command;