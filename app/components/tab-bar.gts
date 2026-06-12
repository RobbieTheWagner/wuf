import type { TOC } from '@ember/component/template-only';
import { LinkTo } from '@ember/routing';
import Mic from 'wuf/svgs/mic.svg';
import TabHome from 'wuf/svgs/tab-home.svg';
import TabUpload from 'wuf/svgs/tab-upload.svg';

const TabBar: TOC<{ Element: HTMLElement }> = <template>
  <nav class="tab-bar" aria-label="App navigation" ...attributes>
    <div class="flex max-w-md mx-auto">
      <LinkTo class="tab-item" @route="index" data-test-tab-home>
        <TabHome height="24" width="24" aria-hidden="true" />
        Home
      </LinkTo>

      <LinkTo class="tab-item" @route="microphone" data-test-tab-listen>
        <Mic height="24" width="24" aria-hidden="true" />
        Listen
      </LinkTo>

      <LinkTo class="tab-item" @route="upload" data-test-tab-upload>
        <TabUpload height="24" width="24" aria-hidden="true" />
        Upload
      </LinkTo>
    </div>
  </nav>
</template>;

export default TabBar;
