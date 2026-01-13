type Path = Array<string | number>;
type Predicate = (value: unknown, path: Path) => boolean;
type Transformer = (value: unknown, path: Path) => unknown;

type TransformOptions = {
  /** Throw on circular refs. If false, returns the already-created output node. */
  throwOnCircular?: boolean;
  /** Include symbol keys when walking objects. */
  includeSymbols?: boolean;
  /** Preserve prototypes of non-plain objects / class instances. */
  preservePrototype?: boolean;
  /**
   * Which "special" objects should be treated as leaves (not recursed into).
   * Defaults exclude common non-JSON structures.
   */
  isLeaf?: (value: unknown) => boolean;
};

const defaultIsLeaf = (v: unknown) =>
  v === null ||
  typeof v !== "object" ||
  v instanceof Date ||
  v instanceof RegExp ||
  v instanceof Map ||
  v instanceof Set ||
  ArrayBuffer.isView(v) || // TypedArray, DataView
  v instanceof ArrayBuffer;

/**
 * Deeply walks an object tree (incl. arrays) and applies `transformer`
 * to any node where `predicate(node, path)` is true.
 *
 * - Preserves property descriptors (incl. getters/setters) without invoking them.
 * - Handles circular refs (configurable).
 * - Arrays are recreated preserving length.
 * - Objects optionally preserve prototype.
 */
export function deepTransform<T>(
  input: T,
  predicate: Predicate,
  transformer: Transformer,
  opts: TransformOptions = {}
): T {
  const {
    throwOnCircular = true,
    includeSymbols = false,
    preservePrototype = true,
    isLeaf = defaultIsLeaf,
  } = opts;

  const seen = new Map<object, any>();

  const walk = (value: any, path: Path): any => {
    // Apply transform at this node *before* descending (pre-order).
    if (predicate(value, path)) {
      return transformer(value, path);
    }

    if (isLeaf(value)) return value;

    // Circular ref handling
    if (seen.has(value)) {
      if (throwOnCircular) {
        throw new TypeError(
          `Circular reference detected at path: ${formatPath(path)}`
        );
      }
      return seen.get(value);
    }

    // Arrays
    if (Array.isArray(value)) {
      const out: any[] = new Array(value.length);
      seen.set(value, out);
      for (let i = 0; i < value.length; i++) {
        out[i] = walk(value[i], path.concat(i));
      }
      return out;
    }

    // Objects (optionally preserve prototype)
    const proto = preservePrototype
      ? Object.getPrototypeOf(value)
      : Object.prototype;
    const out = Object.create(proto);
    seen.set(value, out);

    const keys: (string | symbol)[] = Object.keys(value);
    if (includeSymbols) keys.push(...Object.getOwnPropertySymbols(value));

    for (const k of keys) {
      const desc = Object.getOwnPropertyDescriptor(value, k);
      if (!desc) continue;

      if ("value" in desc) {
        // Don't invoke getters; only transform data properties.
        desc.value = walk(
          desc.value,
          path.concat(typeof k === "symbol" ? k.toString() : k)
        );
      }
      Object.defineProperty(out, k, desc);
    }

    return out;
  };

  return walk(input, []) as T;
}

function formatPath(path: Path) {
  if (path.length === 0) return "$";
  return (
    "$" +
    path
      .map((p) =>
        typeof p === "number"
          ? `[${p}]`
          : /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p)
          ? `.${p}`
          : `["${p.replace(/"/g, '\\"')}"]`
      )
      .join("")
  );
}
