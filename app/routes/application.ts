import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type Owner from '@ember/owner';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';

export default class ApplicationRoute extends Route {
  @service declare audioAnalyzer: AudioAnalyzerService;
  @service declare router: RouterService;

  constructor(owner: Owner) {
    super(owner);

    this.router.on('routeDidChange', () => {
      this.audioAnalyzer.clearBarkData();
    });
  }
}
