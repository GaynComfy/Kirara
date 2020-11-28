const lillieClient = require('../../utils/lillieClient');

exports.getLilliePing = () => {
  const then = Data.now();
  try {
    await lillieClient.request('ping');
  } catch (err) {
    return 'failure';
  }
  const now = Data.now() - then;
  return `${now}ms`;
};
