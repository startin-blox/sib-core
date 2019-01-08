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
export function importCSS(...stylesheets) {
  return stylesheets.map(url => {
    let link = Array.from(document.head.querySelectorAll('link')).find(link => link.href === url);
    if (link) return link;
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return link;
  });
}
