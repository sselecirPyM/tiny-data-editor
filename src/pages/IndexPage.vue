<template>
  <q-page class="flex">
    <q-card style="width: 250px;">
      <q-card-section>
        <q-btn label="open folder" @click="selectFolder" :loading="fileSaving" />
        <!-- <q-toggle v-model="valid" disable /> -->
      </q-card-section>

      <q-card-section>
        <q-btn label="save" :loading="fileSaving" @click="saveFile" />
        <q-btn label="Reload" @click="refresh" />
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
      tEditor: null,
      valid: false,
      schema: null,
      schemaFile: null,
      data: null,
      dataFile: null,
      rootFolder: null,
      items: [],
      fileSaving: false,
      selected: 0
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
        this.dataFile = null;
        this.schema = null;
        this.schemaFile = null;

        this.refresh();
      }, () => { });
    },
    saveFile() {
      if (!this.data || !this.dataFile) {
        return;
      }
      this.fileSaving = true;
      this.dataFile.createWritable().then(async (stream) => {
        const textEncoder = new TextEncoder();
        const text = JSON.stringify(this.data, undefined, 2);
        await stream.write({ type: 'write', data: textEncoder.encode(text) });
        stream.close();
        this.fileSaving = false;
      }, () => { this.fileSaving = false; });
    },
    async selectData(item) {
      const file = await this.getFile(item.schema);
      this.schema = JSON.parse(await file.getFile().then(file => file.text()));
      const file2 = await this.getFile(item.data, true);
      const text = await file2.getFile().then(file => file.text());
      if (text.length > 0)
        this.data = JSON.parse(text);
      else
        this.data = SchemaUtil.createObject(this.schema);
      this.validData();
      this.schemaFile = file;
      this.dataFile = file2;
    },
    async refresh() {
      if (!this.rootFolder)
        return;
      const teditFile = await this.rootFolder.getFileHandle("teditor.json");
      if (teditFile.kind == 'file') {
        const a = JSON.parse(await teditFile.getFile().then(file => file.text()));
        this.items = a.items;
        if (this.items.length > 0) {
          this.selected = 0;
          this.selectData(this.items[0]);
        }
      }
    },
    async getFile(path, create) {
      const paths = path.split('/');
      return await this.getFile1(paths, this.rootFolder, 0, create);
    },
    async getFile1(paths, base, level, create) {
      if (level == paths.length - 1) {
        return await (await base.getFileHandle(paths[level], { create }));
      }
      return await this.getFile1(paths, await base.getDirectoryHandle(paths[level], { create }), level + 1);
    }
  }
})
</script>
