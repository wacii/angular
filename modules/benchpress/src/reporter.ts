import {bind, provide, Provider} from '@angular/core/src/di';
import {BaseException, WrappedException} from '@angular/facade';
import {MeasureValues} from './measure_values';

/**
 * A reporter reports measure values and the valid sample.
 */
export abstract class Reporter {
  static bindTo(delegateToken): Provider[] {
    return [bind(Reporter).toFactory((delegate) => delegate, [delegateToken])];
  }

  reportMeasureValues(values: MeasureValues): Promise<any> { throw new BaseException('NYI'); }

  reportSample(completeSample: MeasureValues[], validSample: MeasureValues[]): Promise<any> {
    throw new BaseException('NYI');
  }
}
