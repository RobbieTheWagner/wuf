import Component from '@ember/component';
import { action } from '@ember/object';

export default class NavMenuComponent extends Component {
  /**
   * Toggle the nav menu open/closed
   * @param {boolean} open When true, should open the menu, false should close
   */
  @action
  toggleNavMenu(open) {
    const navLinks = this.element.querySelector('.nav-links');

    if (open) {
      navLinks.classList.remove('hidden');
    } else {
      navLinks.classList.add('hidden');
    }
  }
}
