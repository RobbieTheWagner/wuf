import Component from '@glimmer/component';
import { capitalize } from '@ember/string';
import type { BarkType as BarkTypeName } from 'wuf/utils/barks';
import Alert from 'wuf/svgs/alert.svg';
import DigIn from 'wuf/svgs/dig-in.svg';
import Distress from 'wuf/svgs/distress.svg';
import Greeting from 'wuf/svgs/greeting.svg';
import Playful from 'wuf/svgs/playful.svg';

const barkIcons = {
  alert: Alert,
  distress: Distress,
  greeting: Greeting,
  playful: Playful,
};

interface BarkTypeSignature {
  Args: {
    barkType?: BarkTypeName;
    barkDescription?: string;
  };
}

export default class BarkType extends Component<BarkTypeSignature> {
  get icon() {
    return this.args.barkType ? barkIcons[this.args.barkType] : DigIn;
  }

  get title() {
    return this.args.barkType ? capitalize(this.args.barkType) : '';
  }

  <template>
    <div class="flex flex-col w-full">
      <h2 class="font-semibold mb-2 text-2xl text-heading">
        Results
      </h2>

      <div class="bg-gray-100 flex p-4 h-80 mb-8 rounded w-full">
        <div class="flex h-full items-center justify-center w-full">
          {{#if @barkType}}
            <div class="animate-fade-in flex items-center">
              <div class="mr-4">
                <this.icon height="200" width="200" />
              </div>
              <div class="grow">
                <h2 class="font-bold text-3xl" data-test-bark-type>
                  {{this.title}}
                </h2>

                <p>
                  {{@barkDescription}}
                </p>
              </div>
            </div>
          {{else}}
            <div
              class="animate-fade-in flex flex-col items-center justify-center h-full w-full"
            >
              <DigIn height="200" width="200" />

              <h4 class="font-black text-center text-heading text-xl">
                We can't wait to dig into your dog's barking data!
              </h4>

              <p class="italic mt-1 text-sm" data-test-no-bark-type>
                No data uploaded yet.
              </p>
            </div>
          {{/if}}
        </div>
      </div>
    </div>
  </template>
}
