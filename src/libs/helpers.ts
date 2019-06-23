function uniqID(): string {
  return '_' + (Math.random() * Math.pow(36, 20)).toString(36).slice(0, 10);
}

function stringToDom(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

function evalTemplateString(str: string, variables = {}): string {
  const keys = Object.keys(variables);
  const values = keys.map(key => variables[key]);
  try {
    const func = Function.call(null, ...keys, 'return `' + str + '`');
    return func(...values);
  } catch (e) {
    console.log(e);
    throw new SyntaxError('`' + str + '`');
  }
}
function importCSS(...stylesheets: string[]): HTMLLinkElement[] {
  return stylesheets.map(url => {
    let link = Array.from(document.head.querySelectorAll('link')).find(
      link => link.href === url,
    );
    if (link) return link;
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return link;
  });
}

function domIsReady(): Promise<any> {
  return new Promise(function(resolve) {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve);
    }
  });
}

function setDeepProperty(obj: object, path: string[], value: object) {
  const name = path.shift();
  if (name) {
    if (!(name in obj)) obj[name] = {};
    if (path.length) setDeepProperty(obj[name], path, value);
    else obj[name] = value;
  }
}

function parseFieldsString(fields: string): string[][] {
  let fieldsArray: string[][];

  // remove all sets from fields
  while(fields.indexOf('(') > 0){
    let firstBracket = fields.indexOf('(');
    let noset = fields.substring(firstBracket, findClosingBracketMatchIndex(fields, firstBracket)+1)
    fields = fields.replace(noset, '')
  }

  fieldsArray = fields
    .split(',') // separate fields
    .map(s => s.trim().split(/\./)); // separate nested fields
  fieldsArray.forEach(field => {
    field.toString = function() {
      return this.join('.');
    };
  });
  return fieldsArray;
}

function getArrayFrom(object: object, key: string): object[] {
  if (!object || !object[key]) return [];
  if (Array.isArray(object[key])) return object[key];
  return [object[key]];
}

function findClosingBracketMatchIndex(str: string, pos: number) {
  if (str[pos] != '(') throw new Error("No '(' at index " + pos);
  let depth = 1;
  for (let i = pos + 1; i < str.length; i++) {
    switch (str[i]) {
    case '(':
      depth++;
      break;
    case ')':
      if (--depth == 0) return i;
      break;
    }
  }
  return -1;
}

export {
  uniqID,
  stringToDom,
  evalTemplateString,
  importCSS,
  domIsReady,
  setDeepProperty,
  parseFieldsString,
  getArrayFrom,
  findClosingBracketMatchIndex
};
