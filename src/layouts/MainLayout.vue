<template>
  <q-layout view="lHh Lpr lFf">
    <!-- <q-header elevated>
      <q-toolbar>

        <q-toolbar-title>
          Tiny Data Editor
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header> -->

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'MainLayout',

  setup () {
    const { locale } = useI18n({ useScope: 'global' });
    return {
      locale,
    };
  },
  mounted() {
    const lang = this.$q.lang.getLocale();
    this.locale = lang;
  }
})
</script>
