declare module "prop-types" {
  export type ReactNodeLike = unknown;

  export interface Validator<T> {
    (
      props: Record<string, unknown>,
      propName: string,
      componentName: string,
      location: string,
      propFullName: string,
    ): Error | null;
    readonly [key: string]: unknown;
  }

  export interface Requireable<T> extends Validator<T | null | undefined> {
    isRequired: Validator<NonNullable<T>>;
  }

  export type ValidationMap<T> = {
    [K in keyof T]?: Validator<T[K]>;
  };

  export type InferType<V> = V extends Validator<infer T> ? T : unknown;
  export type InferProps<V> = {
    [K in keyof V]: InferType<V[K]>;
  };

  export const any: Requireable<unknown>;
  export const array: Requireable<unknown[]>;
  export const bool: Requireable<boolean>;
  export const func: Requireable<(...args: unknown[]) => unknown>;
  export const number: Requireable<number>;
  export const object: Requireable<Record<string, unknown>>;
  export const string: Requireable<string>;
  export const node: Requireable<ReactNodeLike>;
  export const element: Requireable<unknown>;
  export const symbol: Requireable<symbol>;

  export function instanceOf<T>(expectedClass: new (...args: unknown[]) => T): Requireable<T>;
  export function oneOf<T>(types: readonly T[]): Requireable<T>;
  export function oneOfType<T extends Validator<unknown>>(types: readonly T[]): Requireable<InferType<T>>;
  export function arrayOf<T>(type: Validator<T>): Requireable<T[]>;
  export function objectOf<T>(type: Validator<T>): Requireable<Record<string, T>>;
  export function shape<P extends ValidationMap<unknown>>(type: P): Requireable<InferProps<P>>;
  export function exact<P extends ValidationMap<unknown>>(type: P): Requireable<InferProps<P>>;

  const PropTypes: {
    any: typeof any;
    array: typeof array;
    bool: typeof bool;
    func: typeof func;
    number: typeof number;
    object: typeof object;
    string: typeof string;
    node: typeof node;
    element: typeof element;
    symbol: typeof symbol;
    instanceOf: typeof instanceOf;
    oneOf: typeof oneOf;
    oneOfType: typeof oneOfType;
    arrayOf: typeof arrayOf;
    objectOf: typeof objectOf;
    shape: typeof shape;
    exact: typeof exact;
  };

  export default PropTypes;
}
