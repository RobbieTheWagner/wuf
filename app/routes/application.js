import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service audioAnalyzer;
  @service router;

  constructor() {
    super(...arguments);
    
    this.router.on('routeDidChange', () => {
      this.audioAnalyzer.clearBarkData();
    });
  }

  afterModel() {
    super.afterModel(...arguments);

    this.metaInfo = {
      content: 'Talk to your dog with Ember!',
      title: 'Wüf'
    };
  }
}
