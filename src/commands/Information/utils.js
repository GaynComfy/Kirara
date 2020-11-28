const lillieClient = require('../../utils/lillieClient');

exports.getLilliePing = async () => {
  const then = Date.now();
  try {
    await lillieClient.request('ping');
  } catch (err) {
    return 'failure';
  }
  const now = Date.now() - then;
  return `${now}ms`;
};
