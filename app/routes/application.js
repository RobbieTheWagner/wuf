import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {
  afterModel() {
    super.afterModel(...arguments);
    
    this.metaInfo = {
      content: 'Talk to your dog with Ember!',
      title: 'Wüf'  
    };
  }
}
