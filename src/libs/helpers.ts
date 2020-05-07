function uniqID(): string {
  return '_' + (Math.random() * Math.pow(36, 20)).toString(36).slice(0, 10);
}

function stringToDom(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

async function evalTemplateString(str: string, variables: {[key:string]:any} = {}) {
  const keys = Object.keys(variables);
  const values = keys.map(key => variables[key]);
  try {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    const func = AsyncFunction.call(null, ...keys, 'return `' + str + '`');
    return await func(...values);
  } catch (e) {
    console.log(e);
    throw new SyntaxError('`' + str + '`');
  }
}

function importCSS(...stylesheets: string[]): HTMLLinkElement[] {
  return stylesheets.map(url => {
    url = relativeSource(url);
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

function importJS(...plugins: string[]): HTMLScriptElement[] {
  return plugins.map(url => {
    url = new URL(url, document.baseURI).href;
    let script = Array.from(document.querySelectorAll('script')).find(
      script => script.src === url,
    );
    if (script) return script;
    script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
    return script;
  });
}

function relativeSource(source: string) {
  if (source.indexOf('./') !== 0) return new URL(source, document.baseURI).href;
  const e = new Error();
  if(!e.stack) return source;
  const f2 = e.stack.split('\n').filter(l => l.includes(':'))[2];
  let line = f2.match(/[a-z]+:.*$/);
  if (!line) return source;
  const calledFile = line[0].replace(/(\:[0-9]+){2}\)?$/,'');
  source = new URL(source, calledFile).href;
  return source;
  
}
function loadScript(source: string) {
  source = relativeSource(source);
  return new Promise(resolve => {
    var script = document.createElement('script');
    var head = document.querySelector('head');
    script.async = true;
    script.onload = () => setTimeout(resolve, 0);
    script.src = source;
    if(head) head.appendChild(script);
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

function setDeepProperty(obj: {[index:string]:any}, path: string[], value: any) {
  const name = path.shift();
  if (name) {
    if (!(name in obj)) obj[name] = {};
    if (path.length) setDeepProperty(obj[name], path, value);
    else obj[name] = value;
  }
}

function parseFieldsString(fields: string): string[] {
  let fieldsArray: string[];

  // remove all sets from fields
  while(fields.indexOf('(') > 0){
    let firstBracket = fields.indexOf('(');
    let noset = fields.substring(firstBracket, findClosingBracketMatchIndex(fields, firstBracket)+1)
    fields = fields.replace(noset, '')
  }

  fieldsArray = fields
    .split(',') // separate fields
    .map(a => a.trim()) // and remove spaces
  return fieldsArray;
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

function defineComponent(tagName: string, componentClass: typeof HTMLElement) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, componentClass);
  } else {
    console.warn(`Warning: the component "${tagName}" has already been loaded in another version of sib-core.`)
  }
  if (tagName.startsWith('solid-')) {
    const sibTagName = tagName.replace(/^solid-/, 'sib-');

    customElements.define(
      sibTagName,
      class extends componentClass {
        constructor() {
          window.warnings = window.warnings || [];
          if (!window.warnings.includes(tagName)) {
            window.warnings.push(tagName);
            console.warn(
              `<${sibTagName}> is deprecated, please use <${tagName}> insteed`,
            );
          }
          super();
        }
      },
    );
  }
}

export {
  uniqID,
  stringToDom,
  evalTemplateString,
  importCSS,
  importJS,
  loadScript,
  domIsReady,
  setDeepProperty,
  parseFieldsString,
  findClosingBracketMatchIndex,
  defineComponent
};
