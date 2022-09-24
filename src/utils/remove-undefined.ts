export const removeUndefined = (value: Record<string, any>) => {
  Object.keys(value).forEach((key) => {
    if (Object.prototype.toString.call(value[key]) === '[object Undefined]') {
      delete value[key];
    }
  });
  return value;
};
