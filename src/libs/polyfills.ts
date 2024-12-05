// Array.prototype.flat
if (!('flat' in Array.prototype)) {
  Object.defineProperty(Array.prototype, 'flat', {
    configurable: true,
    value: function flat(this: any[], depth = 1) {
      depth = Number.isNaN(depth) ? 1 : Number(depth);
      if (depth === 0) return Array.prototype.slice.call(this);
      return Array.prototype.reduce.call<any, any[], any[]>(
        this,
        (acc: any[], cur: any) => {
          if (Array.isArray(cur)) {
            acc.push.apply(acc, flat.call(cur, depth - 1));
          } else {
            acc.push(cur);
          }
          return acc;
        },
        [],
      );
    },
    writable: true,
  });
}

// Element.prototype.toggleAttribute
if (!Element.prototype.toggleAttribute) {
  Element.prototype.toggleAttribute = function (name, force = undefined) {
    if (force !== undefined) force = !!force;

    if (this.hasAttribute(name)) {
      if (force) return true;

      this.removeAttribute(name);
      return false;
    }
    if (force === false) return false;

    this.setAttribute(name, '');
    return true;
  };
}

export {};
