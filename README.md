# gulp-transform-cache
![Language](https://img.shields.io/badge/-TypeScript-blue.svg)
[![Build Status](https://travis-ci.org/searchfe/gulp-transform-cache.svg?branch=master)](https://travis-ci.org/searchfe/gulp-transform-cache)
[![Coveralls](https://img.shields.io/coveralls/searchfe/gulp-transform-cache.svg)](https://coveralls.io/github/searchfe/gulp-transform-cache)
[![npm package](https://img.shields.io/npm/v/gulp-transform-cache.svg)](https://www.npmjs.org/package/gulp-transform-cache)
[![npm downloads](http://img.shields.io/npm/dm/gulp-transform-cache.svg)](https://www.npmjs.org/package/gulp-transform-cache)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


提供一个自动cache的transform，其API同[readable-stream](https://www.npmjs.org/package/readable-stream)


## How to use

1、编写的Gulp插件管道继承本包export的transform即可
2、生产环境中设置```process.env.build_cache = "open"``` 打开cache
3、插件需要使用callback来返回流，否则该插件不生效cache
4、如果该流返回的文件有其他依赖，请在返回的file文件上附带depFiles: string[]来标明依赖文件的绝对路径

```javascript
class Pipe extends Transform {};
const pipe = new Pipe({
  objectMode: true,
  transform: (file: File, enc, callback) => {
    file.depFiles = ['/home/work/xxxxx/xxxx/a.js', '/home/work/xxxxx/xxxx/b.js'];
    callback(null, file);
  }
});

```


## API

[API DOC](https://searchfe.github.io/gulp-transform-cache/)
