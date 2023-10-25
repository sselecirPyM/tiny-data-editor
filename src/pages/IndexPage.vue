<template>
  <q-page class="flex">
    <q-card flat bordered style="width: 200px;">
      <q-card-section>
        <q-btn label="open folder" @click="selectFolder" :loading="fileSaving" />
        <!-- <q-toggle v-model="valid" disable /> -->
      </q-card-section>

      <q-card-section>
        <q-btn label="Save" :loading="fileSaving" @click="saveFile" />
        <q-btn label="Reload" :loading="fileSaving" @click="refresh" />
        <q-btn label="Export" :loading="fileSaving" @click="exportData" />
      </q-card-section>
      <q-list bordered separator>
        <q-item v-for="(item, index) in items" :key="index" :active="selected == index" :clickable="selected != index"
          @click="selectData(item); selected = index;">
          <q-item-section>{{ item.data }}</q-item-section>
        </q-item>
      </q-list>
    </q-card>
    <template v-if="schema && data">
      <ShowObject :schema="schema" v-model="data" />
    </template>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import ShowObject from 'src/components/ShowObject.vue';
import { SchemaUtil } from '../SchemaUtil'
import Ajv from 'ajv'

const ajv = new Ajv();
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
      rootFolder: null,
      items: [],
      fileSaving: false,
      selected: 0,
      cache: new Map(),
      exports: []
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
            this.saveFile();
          }
          break;
      }
    },
    validData() {
      if (this.schema && this.data) {
        const validate = ajv.compile(this.schema);
        this.valid = validate(this.data);
      }
    },
    selectFolder() {
      window.showDirectoryPicker({ id: "folder" }).then((fileHandle) => {
        this.rootFolder = fileHandle;
        this.data = null;
        this.schema = null;

        this.refresh();
      }, () => { });
    },
    saveFile() {
      if (!this.data) {
        return;
      }
      this.fileSaving = true;

      const promises = [];
      for (const [key, value] of this.cache.entries()) {
        promises.push(this.saveObject(key, value));
      }
      Promise.all(promises).finally(() => this.fileSaving = false);
    },
    async saveObject(path, obj) {
      const textEncoder = new TextEncoder();
      const text = JSON.stringify(obj, undefined, 2);

      await this.saveBuffer(path, textEncoder.encode(text));
    },
    async saveBuffer(path, buffer) {
      const file = await this.getFile(path, true);
      const stream = await file.createWritable();
      await stream.write({ type: 'write', data: buffer });
      stream.close();
    },
    async exportData() {
      this.fileSaving = true;
      try {
        for (const item of this.exports) {
          const text = await this.readText(item.scirpt);
          const exportFunction = (new Function(text))();
          const params = [];
          for (const paramPath of item.parameters) {
            params.push(await this.readObject(paramPath));
          }

          const result = exportFunction(...params);

          if (item.output instanceof ArrayBuffer)
            await this.saveBuffer(item.output, result)
          else if (item.output != undefined)
            await this.saveObject(item.output, result)
        }
      } finally {
        this.fileSaving = false;
      }
    },
    async selectData(item) {
      this.schema = await this.readObject(item.schema);

      const cacheData = this.cache.get(item.data);
      if (cacheData) {
        this.data = cacheData;
      } else {
        try {
          this.data = await this.readObject(item.data);
        } catch (err) {
          this.data = SchemaUtil.createObject(this.schema);
        }

        this.cache.set(item.data, this.data);
      }
      // this.validData();
    },
    async refresh() {
      if (!this.rootFolder)
        return;
      this.cache = new Map();

      let teditFile
      try {
        teditFile = await this.getFile(".teditor/teditor.json");
      } catch (err) { }
      try {
        teditFile = await this.getFile("teditor.json");
      } catch (err) { }

      const a = JSON.parse(await teditFile.getFile().then(file => file.text()));
      this.items = a.items;
      this.exports = (a.exports instanceof Array) ? a.exports : [];
      if (this.items.length > 0) {
        this.selected = 0;
        this.selectData(this.items[0]);
      }
    },
    async readObject(path) {
      const file = await this.getFile(path);
      return JSON.parse(await file.getFile().then(file => file.text()));
    },
    async readText(path) {
      const file = await this.getFile(path);
      return await file.getFile().then(file => file.text());
    },
    async getFile(path, create) {
      const paths = path.split('/');
      return await this.getFile1(paths, this.rootFolder, 0, create);
    },
    async getFile1(paths, base, level, create) {
      if (level == paths.length - 1) {
        return await base.getFileHandle(paths[level], { create });
      }
      const handle = paths[level] == '.' ? base : await base.getDirectoryHandle(paths[level], { create });
      return await this.getFile1(paths, handle, level + 1, create);
    }
  }
})
</script>
