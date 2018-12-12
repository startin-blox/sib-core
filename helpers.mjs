export function uniqID() {
  return '_' + (Math.random() * Math.pow(36, 20)).toString(36).slice(0, 10);
}

export function stringToDom(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

export function evalTemplateString(str, variables = {}) {
  const keys = Object.keys(variables);
  const values = keys.map(key => variables[key]);
  try {
    const func = Function.call(null, ...keys, 'return `' + str + '`');
    return func(...values);
  } catch (e) {
    console.warn(e);
  }
  return '';
}
