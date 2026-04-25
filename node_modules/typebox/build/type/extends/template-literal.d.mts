import { type TSchema } from '../types/schema.mjs';
import { type TProperties } from '../types/properties.mjs';
import { type TExtendsLeft } from './extends-left.mjs';
import { type TTemplateLiteralDecode } from '../engine/template-literal/decode.mjs';
export type TExtendsTemplateLiteral<Inferred extends TProperties, Left extends string, Right extends TSchema, Decoded extends TSchema = TTemplateLiteralDecode<Left>> = TExtendsLeft<Inferred, Decoded, Right>;
export declare function ExtendsTemplateLiteral<Inferred extends TProperties, Left extends string, Right extends TSchema>(inferred: Inferred, left: Left, right: Right): TExtendsTemplateLiteral<Inferred, Left, Right>;
