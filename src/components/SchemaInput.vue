<template>
  <template v-if="schema.type == 'string'">
    <div v-if="schema.format == 'color'">
      {{ schemaTitle }}
      <input type="color" v-model="value" :autofocus="autofocus" />
    </div>
    <q-input v-else-if="schema.format == 'date'" dense type="date" :label="schemaTitle" v-model="value"
      :autofocus="autofocus" />
    <q-select v-else-if="schema.suggestion" :options="suggestions.get(schema.suggestion)" :label="schemaTitle"
      v-model="value" @input-value="(val) => value = val" :autofocus="autofocus" hide-selected use-input fill-input />
    <q-input v-else dense :label="schemaTitle" v-model="value" :autofocus="autofocus">
      <q-menu v-if="value && canDelete(index)" context-menu>
        <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
      </q-menu>
    </q-input>
  </template>
  <q-toggle v-else-if="schema.type == 'boolean'" :label="schemaTitle" v-model="value" />
  <q-input v-else-if="schema.type == 'integer'" dense :label="schemaTitle" type="number" v-model.number="value"
    :autofocus="autofocus" />
  <q-input v-else-if="schema.type == 'number'" dense :label="schemaTitle" type="number" step="any" v-model.number="value"
    :autofocus="autofocus" />
  <q-btn v-else-if="schema.type == 'array' || schema.type == 'object'" :label="buttonLabel(schema.type)"
    @click="showObject(index)">
    <q-menu v-if="value && canDelete(index)" context-menu>
      <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
    </q-menu>
  </q-btn>
  <q-select v-else-if="schema.enum" :options="schema.enum" :label="schemaTitle" v-model="value" :autofocus="autofocus" />
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SchemaInput',
  data() {
    return {

    }
  },
  props: {
    schema: {
    },
    modelValue: {
    },
    index: {
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    suggestions: {
    }
  },
  emits: ['update:modelValue', 'showObject', 'deleteObject'],
  computed: {

    value: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    schemaTitle: {
      get() {
        return this.schema.title ?? this.index;
      }
    }
  },
  methods: {
    buttonLabel(type) {
      if (type == 'array')
        return this.schemaTitle + (this.value ? `: (${this.value.length})` : ': null');
      else
        return this.schemaTitle + (this.value ? '' : ': null');
    },
    canDelete(key) {
      return !this.schema.required?.includes(key);
    },
    showObject(key) {
      this.$emit("showObject", key);
    },
    deleteObject(key) {
      this.$emit("deleteObject", key);
    }
  }
})
</script>