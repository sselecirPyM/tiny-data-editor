<template>
  <div v-if="schema.type == 'string' && schema.format == 'color'">
    {{ schemaTitle }}
    <input type="color" v-model="value" :autofocus="autofocus" />
    <q-menu v-if="value && canDelete(index)" context-menu>
      <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
    </q-menu>
  </div>
  <q-select v-else-if="schema.type == 'string' && schema.suggestion" :options="suggestions.get(schema.suggestion)"
    :label="schemaTitle" v-model="value" @input-value="(val) => value = val" :autofocus="autofocus" hide-selected
    use-input fill-input>
    <q-menu v-if="value && canDelete(index)" context-menu>
      <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
    </q-menu>
  </q-select>
  <q-btn v-else-if="schema.type == 'array' || schema.type == 'object'" :label="buttonLabel(schema.type)"
    @click="showObject(index)">
    <q-menu v-if="value && canDelete(index)" context-menu>
      <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
    </q-menu>
  </q-btn>
  <q-select v-else-if="schema.enum" :options="schema.enum" :label="schemaTitle" v-model="value" :autofocus="autofocus">
    <q-menu v-if="value && canDelete(index)" context-menu>
      <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
    </q-menu>
  </q-select>
  <MixInput v-else :inputType="typeMap" v-model="value" :label="schemaTitle" :autofocus="autofocus">
    <q-menu v-if="value && canDelete(index)" context-menu>
      <q-btn v-close-popup label="delete" color="red" @click="deleteObject(index)" />
    </q-menu>
  </MixInput>
</template>
<script>
import { defineComponent } from 'vue'
import MixInput from './MixInput.vue';

export default defineComponent({
  name: 'SchemaInput',
  data() {
    return {

    }
  },
  components: {
    MixInput
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
    typeMap: {
      get() {
        const schema = this.schema;
        if (schema.type == 'string') {
          if (schema.format == 'date') {
            return schema.format;
          }
          if (schema.format == 'time') {
            return schema.format;
          }
          if (schema.format == 'week') {
            return schema.format;
          }
          if (schema.format == 'month') {
            return schema.format;
          }
          if (schema.format == 'datetime-local') {
            return schema.format;
          }
          return 'string';
        } else {
          return schema.type;
        }
      }
    },
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