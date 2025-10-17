export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export function ok(): Ok<void>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value = undefined): Ok<T> {
  return { ok: true, value: value as T };
}

export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const getOrThrow = <T, E>(result: Result<T, E>): T => {
  if (result.ok) {
    return result.value;
  } else {
    throw new Error("getOrThrow failed", { cause: result.error });
  }
};

export const trySync = <T, E>(
  fn: () => T,
  mapError: (error: unknown) => E
): Result<T, E> => {
  try {
    return ok(fn());
  } catch (error) {
    return err(mapError(error));
  }
};

export const tryAsync = async <T, E>(
  promiseFn: () => Promise<T>,
  mapError: (error: unknown) => E
): Promise<Result<T, E>> =>
  promiseFn().then(
    (value) => ok(value),
    (error: unknown) => err(mapError(error))
  );
