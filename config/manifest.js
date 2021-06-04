'use strict';

module.exports = function (/* environment, appConfig */) {
  // See https://zonkyio.github.io/ember-web-app for a list of
  // supported properties

  return {
    name: 'Wüf',
    short_name: 'Wüf',
    description: 'Talk to your dog with Ember!',
    start_url: '/',
    display: 'standalone',
    background_color: '#D3FAEC',
    theme_color: '#fff',
    icons: [
      {
        src: '/icons/apple-icon-180x180.png',
        sizes: '180x180',
      },
      {
        src: '/icons/apple-icon-180x180.png',
        sizes: '180x180',
        targets: ['apple'],
      },
      {
        src: '/icons/favicon-32x32.png',
        sizes: '32x32',
        targets: ['favicon'],
      },
    ],
    ms: {
      tileColor: '#fff',
    },
  };
};
