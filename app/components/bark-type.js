import Component from '@glimmer/component';
import move from 'ember-animated/motions/move';
import { fadeIn, fadeOut } from 'ember-animated/motions/opacity';

export default class BarkTypeComponent extends Component {
  * transition({ insertedSprites, keptSprites, removedSprites }) {
    for (let sprite of insertedSprites) {
      fadeIn(sprite);
    }

    for (let sprite of keptSprites) {
      move(sprite);
    }

    for (let sprite of removedSprites) {
      fadeOut(sprite);
    }
  }
}