import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { LinkTo } from '@ember/routing';
import Close from 'wuf/svgs/close.svg';
import Menu from 'wuf/svgs/menu.svg';
import Wuf from 'wuf/svgs/wuf.svg';

export default class NavMenu extends Component {
  @tracked isOpen = false;

  /**
   * Toggle the nav menu open/closed
   * @param open When true, should open the menu, false should close
   */
  @action
  toggleNavMenu(open: boolean) {
    this.isOpen = open;
  }

  <template>
    <nav class="flex h-20 items-center justify-center p-6 w-full">
      <div
        class="flex font-medium items-center justify-between max-w-6xl w-full"
      >
        <div class="flex shrink-0 items-center pl-2 pr-2 pt-2">
          <a href="/" class="inline-flex">
            <div class="inline-block">
              <Wuf class="-mt-2 logo-mark p-2" height="60" width="60" />
            </div>
            <div class="font-black text-3xl text-white">
              Wüf
            </div>
          </a>
        </div>

        <div class="block lg:hidden">
          <button
            aria-label="Open navigation menu"
            class="active:scale-90 flex items-center px-3 py-2 text-xl transition-transform"
            type="button"
            {{on "click" (fn this.toggleNavMenu true)}}
          >
            <Menu height="36px" width="36px" />
          </button>
        </div>

        <div class="nav-links {{if this.isOpen 'is-open'}} lg:flex">
          <div class="lg:flex lg:grow lg:justify-end">
            <div class="flex lg:hidden justify-end m-4">
              <button
                aria-label="Close navigation menu"
                class="active:scale-90 cursor-pointer transition-transform"
                type="button"
                {{on "click" (fn this.toggleNavMenu false)}}
              >
                <Close class="h-10 m-2 p-2 w-10" />
              </button>
            </div>
            <LinkTo
              class="nav-link"
              @route="index"
              {{on "click" (fn this.toggleNavMenu false)}}
            >
              Home
            </LinkTo>

            <LinkTo
              class="nav-link"
              @route="upload"
              {{on "click" (fn this.toggleNavMenu false)}}
            >
              File Upload
            </LinkTo>

            <LinkTo
              class="nav-link"
              @route="microphone"
              {{on "click" (fn this.toggleNavMenu false)}}
            >
              Microphone
            </LinkTo>

            <a
              class="nav-link"
              href="https://github.com/shipshapecode/wuf"
              {{on "click" (fn this.toggleNavMenu false)}}
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </nav>
  </template>
}
