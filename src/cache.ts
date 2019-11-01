import { resolve } from 'path';
import { File } from './types';
import { existsSync, writeFileSync, readFileSync, statSync } from 'fs';
import { removeSync, mkdirpSync } from 'fs-extra';
import { getName }  from './hash';

export class Cache {
  public dir: string;
  public setKey(key: string) {
    // 工作路径
    this.dir = resolve(__dirname, '.cache', key || 'temp');
    mkdirpSync(this.dir);
  }

  getPass(file: File) {
    const cacheDir = this.dir + '/' + getName(file);
    if (existsSync(cacheDir + '.pass')) {
      if (existsSync(cacheDir + '.link')) {
        const info =  readFileSync(cacheDir + '.info').toString().split('\n');
        file.path = info[2] || file.path;
        // console.log("完成重定向A");
      }
      return file;
    }
  }

  getCache(file: File): File | undefined {
    const cacheDir = this.dir + '/' + getName(file);
    if (!existsSync(cacheDir + '.cache')) {
      return;
    }
    if (this.checkDeps(cacheDir) === false) {
      return;
    }
    file.contents = readFileSync(cacheDir + '.cache');
    if (existsSync(cacheDir + '.link')) {
      const info =  readFileSync(cacheDir + '.info').toString().split('\n');
      file.path = info[2] || file.path;
      // console.log("完成重定向B");
    }
    return file;
  }

  checkDeps(cacheDir: string) {
    if (!existsSync(cacheDir + '.deps')) {
      return true;
    }
    let diff = false;
    readFileSync(cacheDir + '.deps').toString().split('\n').forEach(line => {
      const arr = line.split('\t');
      if (diff === false && arr.length === 2) {
        if (existsSync(arr[0]) && statSync(arr[0]).mtimeMs.toString() === arr[1]) {
          // 不用做循环依赖分析了
        } else {
          diff = true;
        }
      }
    });
    return !diff;
  }

  passCache(file: File, oldPath: string) {
    if (file && file.stat && file.stat.mtimeMs) {
      const cacheDir =  this.dir + '/' + getName(file, oldPath);
      writeFileSync(cacheDir + '.pass', '');
      writeFileSync(cacheDir + '.info', `${oldPath}\n${file.stat.mtimeMs}\n${file.path}\n`);
      if (oldPath !== file.path) {
        writeFileSync(cacheDir + '.link', '');
      }
    }
  }
  saveCache(file: File, oldPath: string) {
    if (file.depFiles && file.depFiles.length) {
    }
    if (file && file.stat && file.stat.mtimeMs) {
      const cacheDir =  this.dir + '/' + getName(file, oldPath);
      if (file.depFiles && file.depFiles.length) {
        let error = false;
        let depinfo = '';
        file.depFiles.forEach(dep => {
          if (existsSync(dep)) {
            const stat = statSync(dep);
            depinfo += dep + "\t" + stat.mtimeMs + '\n';
          } else {
            console.warn(`WATIN: ${dep} does not exist!`);
            error = true;
          }
        });
        if (error) {
          return;
        }
        // console.log("write deps》》》》》》》》", depinfo);
        writeFileSync(cacheDir + '.deps', depinfo);
      }
      writeFileSync(cacheDir + '.cache', file.contents);
      writeFileSync(cacheDir + '.info', `${oldPath}\n${file.stat.mtimeMs}\n${file.path}\n`);
      if (oldPath !== file.path) {
        writeFileSync(cacheDir + '.link', '');
      }
    }
  }

  proxy(t: transform) {
    if (process.env.build_cache === "open") {
      return (file: File, enc, callback: Callback) => {
        const oldPath = file.path;
        const passFile = this.getPass(file);
        if (passFile) {
          // console.log('pass');
          // 上次无处理 且mtime不变
          callback(null, passFile);
          return;
        }
        const newFile = this.getCache(file);
        const oldBuffer = file.contents;
        if (newFile) {
          // console.log('use cache');
          callback(null, newFile);
        } else {
          // t是业务的回调
          // callback是pipe的回调
          t(file, enc, (buffer, nfile) => {
            // 业务进行了回调
            // if (nfile.path === oldPath) {
              if (oldBuffer === nfile.contents && !nfile.depFiles) {
                // 没有变化 标记无处理
                // console.log('save pass');
                this.passCache(nfile, oldPath);
              } else {
                // console.log('save cache', oldPath, nfile.depFiles);
                this.saveCache(nfile, oldPath);
                nfile.stat.mtimeMs = new Date().getTime();
                nfile.stat.mtime = new Date();
              }
              callback(null, nfile);
            // } else {
            // }
          });
        }
      }
    } else {
      return t;
    }
  }

  static clearAll() {
    removeSync(resolve(__dirname, '.cache'));
  }
}

type transform = (file: File, enc, callback) => void;
type Callback =  (buffer: any, file: File) => void;

/**
 *     传递
 *     改变
 *     不callback
 *     旁路
 */
