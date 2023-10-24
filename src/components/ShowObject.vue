<template>
  <q-card style="max-width: 375px; min-width: 300px;" flat bordered>
    <q-card-section v-if="schema.type == 'object'">
      <div style="text-h5">{{ schema.title }}</div>

      <template v-for="(item, index) in schema.properties" :key="index">
        <q-input v-if="item.type == 'string'" dense :label="item.title ?? index" v-model="value[index]"></q-input>
        <q-input v-else-if="item.type == 'integer'" dense :label="item.title ?? index" type="number"
          v-model="value[index]"></q-input>
        <q-input v-else-if="item.type == 'number'" dense :label="item.title ?? index" type="number" step="any"
          v-model="value[index]"></q-input>
        <q-btn v-else-if="item.type == 'array' || item.type == 'object'" :label="buttonLabel(item.type, index)"
          @click="showObject(index)">
          <q-menu context-menu>
            <q-btn v-if="value[index] && canDelete(index)" v-close-popup label="delete" color="red"
              @click="deleteObject(index)" />
          </q-menu>
        </q-btn>
        <q-select v-if="item.enum" :options="item.enum" :label="item.title ?? index" v-model="value[index]"></q-select>
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
            <q-toggle dense label="Click to edit" v-model="clickToEdit"></q-toggle>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" @click="selectionChange2(props.row.id)">
              <q-td>

              </q-td>
              <q-td v-for="(item, index) in props.cols" :key="index">
                {{ item.format ? item.format(props.row[item.field]) : props.row[item.field] }}
                <q-popup-edit v-if="!item.format && clickToEdit" v-model="props.row[item.field]" v-slot="scope" auto-save>
                  <q-select v-if="item.enum" :options="item.enum" :label="item.label" v-model="scope.value"
                    @keyup.enter="scope.set"></q-select>
                  <q-input v-else :label="item.label" v-model="scope.value" dense autofocus counter
                    :type="(item.type == 'number' || item.type == 'integer') ? 'number' : undefined" step="any"
                    @keyup.enter="scope.set" />
                </q-popup-edit>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </template>
      <q-btn dense label="Add row" @click="addRow" />
      <q-btn dense label="duplicate row" @click="duplicateRow" />
      <q-btn dense flat color="red" label="delete row" @click="deleteRow" />
      <template v-if="schema?.items['type'] == 'number'">
        <q-input v-for="(number, index) in this.value" :key="index" dense :label="index" type="number" step="any"
          v-model="this.value[index]" @focus="path = index" />
      </template>
      <template v-if="schema?.items['type'] == 'integer'">
        <q-input v-for="(number, index) in this.value" :key="index" dense :label="index" type="number" step="1"
          v-model="this.value[index]" @focus="path = index" />
      </template>
      <template v-if="schema?.items['type'] == 'string'">
        <q-input v-for="(number, index) in this.value" :key="index" dense :label="index" v-model="this.value[index]"
          @focus="path = index" />
      </template>
    </template>

  </q-card>
  <ShowObject v-if="path != undefined && childSchema && value[path] != undefined" :schema="childSchema"
    v-model="value[path]" />
</template>

<script>
import { defineComponent, toRaw } from 'vue'
import { SchemaUtil } from '../SchemaUtil'

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
    schema: {
    },
    modelValue: {
    }
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
          type: property.type
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
    canDelete(key) {
      return !this.schema.required?.includes(key);
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
    buttonLabel(type, key) {
      if (type == 'array')
        return key + (this.value[key] ? `: (${this.value[key].length})` : ': null');
      else
        return key + (this.value[key] ? '' : ': null');
    },
    deleteObject(key) {
      this.value[key] = undefined;
    }
  }
})
</script>

<style lang="sass">
.my-sticky-header-column-table

  max-width: 600px
  height: calc(100vh - 40px)

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