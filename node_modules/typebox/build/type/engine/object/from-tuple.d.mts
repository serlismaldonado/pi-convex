import { type TSchema } from '../../types/schema.mjs';
import { type TTuple } from '../../types/tuple.mjs';
import { type TTupleToObject } from '../tuple/to-object.mjs';
import { type TFromType } from './from-type.mjs';
export type TFromTuple<Types extends TSchema[], Object extends TSchema = TTupleToObject<TTuple<Types>>, Result extends TSchema = TFromType<Object>> = Result;
export declare function FromTuple<Types extends TSchema[]>(types: [...Types]): TFromTuple<Types>;
