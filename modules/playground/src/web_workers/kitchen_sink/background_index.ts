import {HelloCmp} from './index_common';
import {bootstrapApp} from '../../../../@angular/platform-browser/src/worker_app';

export function main() {
  bootstrapApp(HelloCmp);
}
