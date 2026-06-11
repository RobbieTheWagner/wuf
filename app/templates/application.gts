import { pageTitle } from 'ember-page-title';
import Footer from 'wuf/components/footer';
import NavMenu from 'wuf/components/nav-menu';

<template>
  {{pageTitle "Wüf"}}

  <NavMenu />

  <main class="min-h-screen p-8">
    {{outlet}}
  </main>

  <Footer />
</template>
