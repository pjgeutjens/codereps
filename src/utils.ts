export const shuffle = <T>(array: T[]): T[] => {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const idx = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    result[i] = result[idx];
    result[idx] = tmp;
  }
  return result;
};
