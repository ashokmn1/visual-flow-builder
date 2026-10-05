/**
 * Variable storage and `{{placeholder}}` interpolation for the flow
 * interpreter. Kept free of React / store imports so it can be unit tested.
 */

export type VariableValue =
  | string
  | number
  | boolean
  | null
  | VariableValue[]
  | { [key: string]: VariableValue };

export type Variables = Record<string, VariableValue>;

/**
 * Resolve a dotted path such as `billing_info.customer.name` against the
 * variables map. Returns `undefined` when any segment is missing.
 */
export const resolvePath = (
  variables: Variables,
  path: string
): VariableValue | undefined => {
  const segments = path.trim().split('.').filter(Boolean);
  if (segments.length === 0) return undefined;

  let current: VariableValue | undefined = variables[segments[0]];
  for (const segment of segments.slice(1)) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else if (typeof current === 'object') {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
};

/** Human-readable rendering of a variable value for chat bubbles and logs. */
export const formatValue = (value: VariableValue | undefined): string => {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const PLACEHOLDER = /\{\{\s*([a-zA-Z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}/g;

/**
 * Replace every `{{variable.path}}` in `template` with its value. Unknown
 * variables are left untouched so the author can spot the typo in the preview.
 */
export const interpolate = (template: string, variables: Variables): string =>
  template.replace(PLACEHOLDER, (match, path: string) => {
    const value = resolvePath(variables, path);
    return value === undefined ? match : formatValue(value);
  });
