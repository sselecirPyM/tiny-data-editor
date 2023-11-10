<template>

  <q-input v-if="inputType == 'string'" dense :label="label" v-model="value">
    <slot></slot>
  </q-input>
  <q-input v-else-if="inputType == 'date'" type="date" dense :label="label" v-model="value">
    <slot></slot>
  </q-input>
  <q-toggle v-else-if="inputType == 'boolean'" :label="label" v-model="value">
    <slot></slot>
  </q-toggle>
  <q-input v-else-if="inputType == 'integer'" dense :label="label" type="number" v-model.number="value">
    <slot></slot>
  </q-input>
  <q-input v-else-if="inputType == 'number'" dense :label="label" type="number" step="any" v-model.number="value">
    <slot></slot>
  </q-input>
  <q-input v-else-if="inputType == 'time'" type="time" dense :label="label" v-model="value">
    <slot></slot>
  </q-input>
  <q-input v-else-if="inputType == 'week'" type="week" dense :label="label" v-model="value">
    <slot></slot>
  </q-input>
  <q-input v-else-if="inputType == 'month'" type="month" dense :label="label" v-model="value">
    <slot></slot>
  </q-input>
  <q-input v-else-if="inputType == 'datetime-local'" type="datetime-local" dense :label="label" v-model="value">
    <slot></slot>
  </q-input>
  <!-- <q-select v-else-if="inputType == 'enum'" :options="options" :label="label" v-model="value" />
  <q-select v-else-if="inputType == 'stringSuggestion'" :options="options" :label="label" v-model="value"
    @input-value="(val) => value = val" hide-selected use-input fill-input /> -->
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MixInput',
  data() {
    return {
    }
  },
  props: {
    inputType: {
    },
    modelValue: {
    },
    options: {
    },
    label: {
    }
  },
  emits: ['update:modelValue'],
  computed: {

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
  }
})
</script>