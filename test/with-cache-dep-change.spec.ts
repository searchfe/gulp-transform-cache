import { readFileSync, readdirSync } from 'fs';
import * as gulp from 'gulp';
import { removeSync } from 'fs-extra';
import { resolve as r } from 'path';
import { File } from '../src/types';
import { Cache } from '../src/cache';
import { Transform } from '../src/transform';
import { Transform as Pipe } from "readable-stream";

const root = __dirname;
const fileName = 'origin.dep.js';
const cacheDir = r(__dirname, '../src/.cache');
const depA = r(__dirname, 'assert/depA.js');
const depB = r(__dirname, 'assert/depB.js');
// const content = readFileSync(filePath);
// const prefix = 'molecule';

describe('With Cache With change', () => {

  // 使用cache，这个管道不产生变化，但依赖变化了（file.contents改变）
  // 测试1：产生cache，测试2：复用cache，测试3：因为mtime失效，不复用且生成新cache

  beforeAll(() => {
    removeSync(r(root, '../src/.cache/DepCache'));
    removeSync(`${root}\/dist/${fileName}`);
    process.env.build_cache = "open";
  });

  it('produce cache', () => {
    let deal = 0; // 处理计数
    class DepCache extends Transform {};
    const nocache = new DepCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        // do nothing
        file.depFiles = [depA, depB];
        callback(null, file);
        deal ++;
      }
    });

    return new Promise((resolve) => {

      /** start */
      gulp.src(
        `${root}\/assert/${fileName}`, {
        base: `${root}\/assert`,
      },
      ).pipe(nocache).pipe(
        gulp.dest(`${root}\/dist\/`),
      ).on('end',
        () => {
          const code = readFileSync(`${root}\/dist/${fileName}`).toString();
          const origin = readFileSync(`${root}\/assert/${fileName}`).toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(1);
          expect(origin).toBe(code);
          //expect(existsSync(resolve(cacheDir, `DepCache/${File}`)));
          expect(readdirSync(r(cacheDir, `DepCache`)).join('|') + '|').toMatch(".cache|");
          expect(readdirSync(r(cacheDir, `DepCache`)).join('|') + '|').toMatch(".deps|");
          resolve();
        },
      );
    });
    /** end */
  });


  it('use cache', () => {
    removeSync(`${root}\/dist/${fileName}`);
    let deal = 0; // 处理计数
    class DepCache extends Transform {};
    const nocache = new DepCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        file.depFiles = [depA, depB];
        callback(null, file);
        deal ++;
      }
    });

    return new Promise((resolve) => {

      /** start */
      gulp.src(
        `${root}\/assert/${fileName}`, {
        base: `${root}\/assert`,
      },
      ).pipe(nocache).pipe(
        gulp.dest(`${root}\/dist\/`),
      ).on('end',
        () => {
          const code = readFileSync(`${root}\/dist/${fileName}`).toString();
          const origin = readFileSync(`${root}\/assert/${fileName}`).toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(0);
          expect(origin).toBe(code);
          resolve();
        },
      );
    });
    /** end */
  });


  it('dep change', () => {
    removeSync(`${root}\/dist/${fileName}`);
    let deal = 0; // 处理计数
    class DepCache extends Transform {};
    const nocache = new DepCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        file.depFiles = [depA, depB];
        callback(null, file);
        deal ++;
      }
    });

    return new Promise((resolve) => {

      /** start */
      gulp.src(
        `${root}\/assert/${fileName}`, {
        base: `${root}\/assert`,
      },
      ).pipe(
        new Pipe({
          objectMode: true,
          transform: (file: File, enc, callback) => {
            file.stat.mtimeMs = new Date().getTime();
            callback(null, file);
          }
        })
      ).pipe(nocache).pipe(
        gulp.dest(`${root}\/dist\/`),
      ).on('end',
        () => {
          const code = readFileSync(`${root}\/dist/${fileName}`).toString();
          const origin = readFileSync(`${root}\/assert/${fileName}`).toString();
          // console.log(code);
          // tslint:disable-next-line:no-eval
          // eval(code);
          console.log(code);
          expect(deal).toBe(1);
          expect(origin).toBe(code);
          expect(readdirSync(r(cacheDir, `DepCache`)).length).toBe(6);
          resolve();
        },
      );
    });
    /** end */
  });
});
