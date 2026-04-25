import { type TSchema } from '../../types/schema.mjs';
import { type TEnumValue } from '../../types/enum.mjs';
import { type TEnumValuesToVariants } from '../enum/enum-to-union.mjs';
import { type TFromUnion } from './from-union.mjs';
export type TFromEnum<Values extends TEnumValue[], Variants extends TSchema[] = TEnumValuesToVariants<Values>, Result extends string[] = TFromUnion<Variants>> = Result;
export declare function FromEnum<Values extends TEnumValue[]>(values: [...Values]): TFromEnum<Values>;
