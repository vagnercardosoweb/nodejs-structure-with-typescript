export class MaskValue {
  public static create(value: string, mask: string): string {
    const parseMask = mask.replace(/[^#]/g, '');
    const parseValue = this.unmask(value);
    if (parseMask.length !== parseValue.length) return value;
    let result = '';
    let maskIndex = 0;
    // let unmaskedIndex = 0;
    for (let i = 0; i < mask.length; i += 1) {
      if (mask[i] === '#' && typeof parseValue[maskIndex] !== 'undefined') {
        result += parseValue[maskIndex];
        maskIndex += 1;
      } else if (typeof mask[i] !== 'undefined') {
        result += mask[i];
        // unmaskedIndex += 1;
      }
    }
    return result;
  }

  public static unmask(value: string): string {
    return value.replace(/[\s\\.\-_:/]/gm, '');
  }
}
