import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import * as gulp from 'gulp';
import { removeSync } from 'fs-extra';
import { resolve as r } from 'path';
import { File } from '../src/types';
import { Cache } from '../src/cache';
import { Transform } from '../src/transform';

const root = __dirname;
const fileName = 'origin.without.js';
const cacheDir = r(__dirname, '../src/.cache');
// const content = readFileSync(filePath);
// const prefix = 'molecule';

describe('Without Cache', () => {
  // 完全不使用cache的测试
  beforeAll(() => {
    removeSync(r(root, '../src/.cache/NoCache'));
    removeSync(`${root}\/dist/${fileName}`);
    process.env.build_cache = "close";
  });

  it('do nothing', () => {
    let deal = 0; // 处理计数
    class NoCache extends Transform {};
    const nocache = new NoCache({
      objectMode: true,
      transform: (file: File, enc, callback) => {
        // do nothing
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
          //expect(existsSync(resolve(cacheDir, `NoCache/${File}`)));
          expect(readdirSync(r(cacheDir, `NoCache`)).length).toBe(0);
          resolve();
        },
      );
    });
    /** end */

  });
});
