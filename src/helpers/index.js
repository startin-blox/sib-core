function uniqID() {
  return `_${(Math.random() * (36 ** 20)).toString(36).slice(0, 10)}`;
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
    const func = Function.call(null, ...keys, `return \`${str}\``);
    return func(...values);
  } catch (e) {
    throw new SyntaxError(`\`${str}\``);
  }
}
function importCSS(...stylesheets) {
  return stylesheets.map((url) => {
    let link = Array.from(document.head.querySelectorAll('link')).find(
      lk => lk.href === url,
    );
    if (link) return link;
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return link;
  });
}

function domIsReady() {
  return new Promise(((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve);
    }
  }));
}

export {
  uniqID, stringToDom, evalTemplateString, importCSS, domIsReady,
};
