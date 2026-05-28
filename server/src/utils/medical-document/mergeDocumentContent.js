function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function mergeDocumentContent(base, overrides) {
  if (!isObject(base)) return overrides ?? base;
  if (!isObject(overrides)) return base;

  const result = { ...base };

  for (const key of Object.keys(overrides)) {
    const baseValue = base[key];
    const overrideValue = overrides[key];

    if (isObject(baseValue) && isObject(overrideValue)) {
      result[key] = mergeDocumentContent(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result;
}