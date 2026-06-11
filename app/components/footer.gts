import type { TOC } from '@ember/component/template-only';
import Wuf from 'wuf/svgs/wuf.svg';

const Footer: TOC<{ Element: HTMLDivElement }> = <template>
  <div class="bg-main text-white" ...attributes>
    <nav class="flex h-40 items-end justify-center p-6 w-full">
      <div class="flex flex-wrap items-center justify-between max-w-6xl w-full">
        <a href="/" class="inline-flex">
          <div class="inline-block">
            <Wuf class="-mt-2 p-2" height="60" width="60" />
          </div>
          <div class="font-black text-3xl">
            Wüf
          </div>
        </a>

        <p class="text-sm">
          Copyright © 2020
          <a href="https://shipshape.io" class="underline hover:text-white">
            Ship Shape Consulting LLC.
          </a>
          All rights reserved.
        </p>
      </div>
    </nav>
  </div>
</template>;

export default Footer;
