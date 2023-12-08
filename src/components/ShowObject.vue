<template>
  <q-card style="max-width: 400px; min-width: 300px;" flat bordered>
    <q-card-section v-if="schema.type == 'object'">
      <div style="text-h5">{{ schema.title }}</div>

      <template v-for="(item, index) in schema.properties" :key="index">
        <SchemaInput :schema="item" :suggestions="suggestions" :index="index" v-model="value[index]"
          @show-object="showObject" @delete-object="deleteObject" />
      </template>
    </q-card-section>

    <template v-if="schema.type == 'array' && value">
      <template v-if="schema?.items['type'] == 'object'">
        <q-table class="my-sticky-header-column-table" virtual-scroll dense flat :columns="columns" :rows="value"
          selection="single" row-key="id" v-model:selected="selected" :filter="filter" @selection="selectionChange"
          :rows-per-page-options="[0]">
          <template v-slot:top>
            <q-input dense debounce="300" color="primary" v-model="filter">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-toggle dense :label="$t('clickToEdit')" v-model="clickToEdit" />
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" @click="selectionChange2(props.row.id)">
              <q-td>

              </q-td>
              <q-td v-for="(item, index) in props.cols" :key="index">
                {{ item.format ? item.format(props.row[item.field]) : props.row[item.field] }}

                <q-popup-edit v-if="!item.format && clickToEdit" v-model="props.row[item.field]" v-slot="scope" auto-save>
                  <SchemaInput :schema="item.schema" :suggestions="suggestions" :index="item.field" v-model="scope.value"
                    autofocus />
                </q-popup-edit>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </template>
      <q-btn dense :label="$t('moveUp')" @click="move(-1)" />
      <q-btn dense :label="$t('moveDown')" @click="move(1)" />
      <q-btn dense :label="$t('addRow')" @click="addRow" />
      <q-btn dense :label="$t('duplicateRow')" @click="duplicateRow" />
      <q-btn dense flat color="red" :label="$t('deleteRow')" @click="deleteRow" />
      <template v-if="schema?.items['type'] != 'object' && schema?.items['type'] != 'array'">
        <SchemaInput v-for="(item, index) in this.value" :key="index" :index="index" :schema="schema.items"
          :suggestions="suggestions" v-model="this.value[index]" />
      </template>
    </template>

  </q-card>
  <ShowObject v-if="path != undefined && childSchema && value[path] != undefined" :schema="childSchema"
    :suggestions="suggestions" v-model="value[path]" />
</template>

<script>
import { defineComponent, toRaw } from 'vue'
import { SchemaUtil } from '../SchemaUtil'
import SchemaInput from './SchemaInput.vue';

export default defineComponent({
  name: 'ShowObject',
  data() {
    return {
      file: null,
      path: null,
      selected: [],
      filter: '',
      clickToEdit: false
    };
  },
  props: {
    schema: {},
    modelValue: {},
    suggestions: {}
  },
  components: {
    SchemaInput
  },
  emits: ['update:modelValue'],
  computed: {
    columns() {
      const items = this.schema.items;
      if (!items)
        return [];
      const target = [];
      for (const key in items.properties) {
        let format = undefined;
        const property = items.properties[key];
        if (property.type == 'array') {
          format = (val, row) => `(${val?.length})`;
        }
        if (property.type == 'object') {
          format = (val, row) => `${val}`;
        }
        target.push({
          name: key,
          label: property.title ?? key,
          field: key,
          align: 'left',
          sortable: true,
          format: format,
          enum: property.enum,
          type: property.type,
          sformat: property.format,
          schema: property
        });
      }
      return target;
    },
    childSchema() {
      if (this.schema.type == 'array') {
        return this.schema.items;
      }
      if (!this.schema.properties)
        return undefined;
      return this.schema.properties[this.path];
    },
    value: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  methods: {
    showObject(path) {
      this.path = path;
      if (this.value[path] != null)
        return;

      let items = this.schema.properties[path];
      if (!items)
        return;

      const target = SchemaUtil.createObject(items);
      this.value[path] = target;
    },
    keys2Path() {
      const map = new Map();
      for (let i = 0; i < this.value.length; i++) {
        map.set(this.value[i].id, i);
      }
      return map;
    },
    selectionChange(event) {
      const map = this.keys2Path();
      if (event.added)
        this.path = map.get(event.keys[0]);
      else
        this.path = null;
    },
    selectionChange2(item) {
      const map = this.keys2Path();
      this.path = map.get(item);
    },
    addRow() {
      const items = this.schema.items;
      if (!items)
        return;

      const target = SchemaUtil.createObject(items);
      this.autoId(items, target);

      this.value.push(target);
    },
    autoId(items, object) {
      if (this.schema.type == 'array' && items.properties?.id?.type == 'integer' && items.required?.find((value) => value == 'id')) {
        const maxId = this.value.reduce((a, b) => Math.max(a, b.id), 0);
        object.id = maxId + 1;
      }
    },
    deleteRow() {
      if (this.path == null) {
        return;
      }
      this.value.splice(this.path, 1);
    },
    duplicateRow() {
      const source = toRaw(this.value[this.path]);
      if (source == null)
        return;

      const target = structuredClone(source);
      this.autoId(this.schema.items, target);

      this.value.push(target);
    },
    deleteObject(key) {
      this.value[key] = undefined;
    },
    move(offset) {
      let path1 = this.path;
      if (path1 < 0 || path1 > this.value.length - 1)
        return;
      path1 += offset;
      if (path1 < 0 || path1 > this.value.length - 1)
        return;
      let temp = this.value[this.path];
      this.value[this.path] = this.value[path1];
      this.value[path1] = temp;
      this.path = path1;
    }
  }
})
</script>

<style lang="sass">
.my-sticky-header-column-table

  max-width: 600px
  height: calc(100vh - 80px)

  td:first-child
    background-color: $secondary !important

  tr th
    position: sticky
    z-index: 2
    background: $secondary

  thead tr:last-child th
    top: 48px
    z-index: 3
  thead tr:first-child th
    top: 0
    z-index: 1
  tr:first-child th:first-child
    z-index: 3

  td:first-child
    z-index: 1

  td:first-child, th:first-child
    position: sticky
    left: 0
</style>