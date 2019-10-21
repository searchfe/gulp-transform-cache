import { Cache } from "./cache";
import { File } from './types';
import stream = require('readable-stream');

export abstract class Transform extends stream.Transform {
  constructor(option ?:any) {

    const cache = new Cache();
    if (option.transform) {
      option.transform =  cache.proxy(option.transform);
    }
    super(option);
    cache.setKey(this.constructor.name);
  }
}
