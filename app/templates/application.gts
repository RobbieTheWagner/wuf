import Component from '@glimmer/component';
import { service } from '@ember/service';
import { pageTitle } from 'ember-page-title';
import type RouterService from '@ember/routing/router-service';
import Footer from 'wuf/components/footer';
import NavMenu from 'wuf/components/nav-menu';
import TabBar from 'wuf/components/tab-bar';

const APP_ROUTES = ['microphone', 'upload'];

export default class ApplicationTemplate extends Component {
  @service declare router: RouterService;

  /** App screens get the native shell + tab bar; home gets marketing chrome */
  get isAppScreen() {
    const routeName = this.router.currentRouteName ?? '';
    return APP_ROUTES.some(
      (route) => routeName === route || routeName.startsWith(`${route}.`),
    );
  }

  <template>
    {{pageTitle "Wüf"}}

    {{#if this.isAppScreen}}
      <div class="app-shell">
        <main>
          {{outlet}}
        </main>

        <TabBar />
      </div>
    {{else}}
      <NavMenu />

      <main class="min-h-screen">
        {{outlet}}
      </main>

      <Footer />
    {{/if}}
  </template>
}
