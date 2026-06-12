import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { renderSettled } from '@ember/renderer';
import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import type Owner from '@ember/owner';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';

export default class ApplicationRoute extends Route {
  @service declare audioAnalyzer: AudioAnalyzerService;
  @service declare router: RouterService;

  viewTransitionPending = false;

  constructor(owner: Owner) {
    super(owner);

    this.router.on('routeDidChange', () => {
      this.audioAnalyzer.clearBarkData();
    });

    this.router.on('routeWillChange', (transition) => {
      this.maybeStartViewTransition(transition);
    });
  }

  /**
   * Animates route changes with the View Transitions API where supported;
   * the snapshot pair is choreographed by the ::view-transition rules in
   * app.css. Everywhere else navigation just snaps, as before.
   */
  maybeStartViewTransition(transition: Transition): void {
    if (
      this.viewTransitionPending ||
      !document.startViewTransition ||
      !transition.from || // initial render
      transition.isAborted ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.viewTransitionPending = true;

    const viewTransition = document.startViewTransition(async () => {
      try {
        await transition.followRedirects();
      } catch {
        // Transition was aborted — finish the snapshot with the current DOM
      }
      await renderSettled();
    });

    void viewTransition.finished.finally(() => {
      this.viewTransitionPending = false;
    });
  }
}
