<template>
  <q-page class="flex">
    <q-card flat bordered style="width: 200px;">
      <q-card-section>
        <q-btn label="open folder" @click="selectFolder" :loading="fileSaving" />
        <!-- <q-toggle v-model="valid" disable /> -->
      </q-card-section>

      <q-card-section>
        <q-btn label="Save" :loading="fileSaving" :disable="!this.data" @click="saveProject" />
        <q-btn label="Reload" :loading="fileSaving" :disable="!this.data" @click="refresh" />
        <q-btn label="Export" :loading="fileSaving" :disable="!this.data" @click="exportData" />
        <q-btn label="Rescan suggestions" :loading="fileSaving" :disable="!this.data" @click="scanSuggestions" />
        <q-toggle label="auto export" v-model="exportWhenSave" />
      </q-card-section>
      <q-list bordered separator>
        <q-item v-for="(item, index) in items" :key="index" :active="selected == index" :clickable="selected != index"
          @click="selectData(item); selected = index;">
          <q-item-section>{{ item.data }}</q-item-section>
        </q-item>
      </q-list>
    </q-card>
    <template v-if="schema && data">
      <ShowObject :schema="schema" v-model="data" :suggestions="suggestions" />
    </template>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import ShowObject from 'src/components/ShowObject.vue';
import { SchemaUtil } from '../SchemaUtil'
import { FSLocal } from '../FSLocal'
// import Ajv from 'ajv'

// const ajv = new Ajv();
export default defineComponent({
  name: 'IndexPage',
  components: {
    ShowObject
  },
  data() {
    return {
      valid: false,
      schema: null,
      data: null,
      items: [],
      fileSaving: false,
      selected: 0,
      cache: new Map(),
      exports: [],
      fs: null,
      suggestions: null,
      suggestionsDesc: null,
      exportWhenSave: false
    };
  },
  mounted() {
    window.addEventListener('keydown', this.handleEvent);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEvent);
  },
  methods: {
    handleEvent(event) {
      switch (event.keyCode) {
        case 83:
          if (event.ctrlKey && event.code === 'KeyS') {

            console.log('ctrl + s');
            event.preventDefault();
            event.returnValue = false;
            this.saveProject();
          }
          break;
      }
    },
    // validData() {
    //   if (this.schema && this.data) {
    //     const validate = ajv.compile(this.schema);
    //     this.valid = validate(this.data);
    //   }
    // },
    selectFolder() {
      window.showDirectoryPicker({ id: "folder" }).then((fileHandle) => {
        this.fs = new FSLocal(fileHandle);
        this.data = null;
        this.schema = null;

        this.refresh();
      }, () => { });
    },
    saveProject() {
      if (!this.data)
        return;
      this.fileSaving = true;

      const promises = [];
      for (const [key, value] of this.cache.entries()) {
        promises.push(this.fs.saveObject(key, value));
      }
      Promise.all(promises).finally(() => {
        this.fileSaving = false;
        if (this.exportWhenSave) {
          this.exportData();
        }
      });
    },
    async exportData() {
      this.fileSaving = true;
      try {
        for (const item of this.exports) {
          const text = await this.fs.readText(item.scirpt);
          const exportFunction = (new Function(text))();
          const params = [];
          for (const path of item.parameters) {
            params.push(await this.fs.readObject(path));
          }
          const result = await exportFunction(...params);

          if (item.output instanceof ArrayBuffer)
            await this.fs.saveBuffer(item.output, result)
          else if (item.output != undefined)
            await this.fs.saveObject(item.output, result)
        }
      } finally {
        this.fileSaving = false;
      }
    },
    async selectData(item) {
      this.schema = await this.fs.readObject(item.schema);

      const cacheData = this.cache.get(item.data);
      if (cacheData) {
        this.data = cacheData;
      } else {
        try {
          this.data = await this.fs.readObject(item.data);
        } catch (err) {
          this.data = SchemaUtil.createObject(this.schema);
        }

        this.cache.set(item.data, this.data);
      }
      // this.validData();
    },
    async refresh() {
      if (!this.fs)
        return;
      this.cache = new Map();

      let teditFile
      try {
        teditFile ??= await this.fs.readObject("teditor.json");
      } catch (err) { }
      try {
        teditFile ??= await this.fs.readObject(".teditor/teditor.json");
      } catch (err) { }

      this.items = teditFile.items;
      this.exports = (teditFile.exports instanceof Array) ? teditFile.exports : [];
      if (this.items.length > 0) {
        this.selected = 0;
        this.selectData(this.items[0]);
      }
      this.suggestionsDesc = teditFile.suggestions;
      this.exportWhenSave = teditFile.autoExport ? true : false;
      await this.scanSuggestions();
    },
    async scanSuggestions() {
      this.suggestions = new Map();
      if (!this.suggestionsDesc) {
        return;
      }
      for (const key in this.suggestionsDesc) {
        const value = this.suggestionsDesc[key];
        try {
          if (value.type == 'enum') {
            this.suggestions.set(key, value.enum);
          } else if (value.type == 'filename') {
            const re = new RegExp(value.match);
            this.suggestions.set(key, await this.fs.searchFileName(value.path, re));
          } else if (value.type == 'json') {
            const array = (await this.fs.readObject(value.path));
            array.sort();
            this.suggestions.set(key, array);
          }
        } catch (err) {
          this.suggestions.set(key, []);
        }
      }
    }
  }
})
</script>
