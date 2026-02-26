/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
function decimalAdjust(type, value, exp) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math[type](value);
  }
  value = +value;
  exp = +exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Shift
  const valParts = value.toString().split('e');
  const adjustedValue = Math[type](
    +(valParts[0] + 'e' + (valParts[1] ? +valParts[1] - exp : -exp))
  );
  // Shift back
  const adjustedParts = adjustedValue.toString().split('e');
  return +(adjustedParts[0] + 'e' + (adjustedParts[1] ? +adjustedParts[1] + exp : exp));
}

export const round10 = (value, exp) => decimalAdjust('round', value, exp);
export const floor10 = (value, exp) => decimalAdjust('floor', value, exp);
export const ceil10 = (value, exp) => decimalAdjust('ceil', value, exp);
