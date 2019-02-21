export default function (str) {
  if (str.match(/\-/)) {
    return str.replace(/\-+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
  }
  return str.replace(/([A-Z])/g, function(match, chr) {
    return `-${chr.toLowerCase()}`;
  });
}
