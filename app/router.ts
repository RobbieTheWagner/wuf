import EmberRouter from '@embroider/router';
import config from 'wuf/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('upload');
  this.route('microphone');
});
