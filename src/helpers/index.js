function uniqID() {
  return '_' + (Math.random() * Math.pow(36, 20)).toString(36).slice(0, 10);
}

function stringToDom(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

function evalTemplateString(str, variables = {}) {
  const keys = Object.keys(variables);
  const values = keys.map(key => variables[key]);
  try {
    const func = Function.call(null, ...keys, 'return `' + str + '`');
    return func(...values);
  } catch (error) {
    if(!(error instanceof SyntaxError)) return '';
    console.error(new SyntaxError('`' + str + '`'));
    throw error;
  }
}
function importCSS(...stylesheets) {
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

function importJS(...plugins) {
  return plugins.map(url => {
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

function domIsReady() {
  return new Promise(function(resolve) {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve);
    }
  });
}

function setDeepProperty(obj, path, value) {
  const name = path.shift();
  if (!(name in obj)) obj[name] = {};
  if (path.length) setDeepProperty(obj[name], path, value);
  else obj[name] = value;
}

function getArrayFrom(object, key) {
  if (!object || !object[key]) return [];
  if (Array.isArray(object[key])) return object[key];
  return [object[key]];
}

export {
  uniqID,
  stringToDom,
  evalTemplateString,
  importCSS,
  importJS,
  domIsReady,
  setDeepProperty,
  getArrayFrom
};
