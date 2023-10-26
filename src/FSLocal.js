export class FSLocal {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  async searchFileName(basePath, regex) {
    let dir;
    // try {
    dir = await this.getDirectoryHandle(basePath);
    // } catch (err) {
    //   return [];
    // }
    if (!basePath || basePath.length == 0) {
      basePath = '';
    } else if (basePath[basePath.length - 1] != '/') {
      basePath = basePath + '/'
    }
    const result = [];
    await this.searchFileName1(basePath, dir, regex, result);
    return result;
  }
  async searchFileName1(basePath, dirHandle, regex, result) {
    for await (const value of dirHandle.values()) {
      if (value.kind == 'directory') {
        await this.searchFileName1(basePath + value.name + '/', value, regex, result);
      } else {
        if (regex.test(value.name)) {
          result.push(basePath + value.name);
        }
      }
    }
  }

  async saveObject(path, obj) {
    const textEncoder = new TextEncoder();
    const text = JSON.stringify(obj, undefined, 2);
    await this.saveBuffer(path, textEncoder.encode(text));
  }
  async saveBuffer(path, buffer) {
    const file = await this.getFileHandle(path, true);
    const stream = await file.createWritable();
    await stream.write({ type: 'write', data: buffer });
    stream.close();
  }

  async readObject(path) {
    const file = await this.getFileHandle(path);
    return JSON.parse(await file.getFile().then(file => file.text()));
  }
  async readText(path) {
    const file = await this.getFileHandle(path);
    return await file.getFile().then(file => file.text());
  }
  async getDirectoryHandle(path, create) {
    if (!path)
      return this.rootDirectory;
    const paths = path.split('/');
    return await FSLocal.getDirectoryHandle1(paths, this.rootDirectory, 0, create);
  }
  static async getDirectoryHandle1(paths, base, level, create) {
    const path = paths[level];
    if (level == paths.length - 1) {
      if (path.length == 0)
        return base;
      return await base.getDirectoryHandle(path, { create });
    } else {
      const handle = path == '.' ? base : await base.getDirectoryHandle(path, { create });
      return await FSLocal.getDirectoryHandle1(paths, handle, level + 1, create);
    }
  }
  async getFileHandle(path, create) {
    const paths = path.split('/');
    return await FSLocal.getFileHandle1(paths, this.rootDirectory, 0, create);
  }
  static async getFileHandle1(paths, base, level, create) {
    const path = paths[level];
    if (level == paths.length - 1) {
      return await base.getFileHandle(path, { create });
    } else {
      const handle = path == '.' ? base : await base.getDirectoryHandle(path, { create });
      return await FSLocal.getFileHandle1(paths, handle, level + 1, create);
    }
  }
}