export class SchemaUtil {
  static createObject(items) {
    if (items.type == "object") {
      const target = {};
      if (items.required) {
        for (const key of items.required) {
          const prop = items.properties[key];
          if (prop.type == 'array') {
            target[key] = [];
          } else if (prop.type == 'number') {
            target[key] = 0;
          } else if (prop.type == 'integer') {
            target[key] = 0;
          } else if (prop.type == 'string') {
            target[key] = '';
          } else if (prop.type == 'boolean') {
            target[key] = false;
          } else if (prop.type == 'object') {
            if (prop.properties) {
              target[key] = SchemaUtil.createObject(prop);
            } else {
              target[key] = {};
            }
          }
        }
      }
      return target;
    }
    else if (items.type == "array") {
      return [];
    }
    else if (items.type == "number") {
      return 0;
    }
    else if (items.type == "integer") {
      return 0;
    }
  }
}