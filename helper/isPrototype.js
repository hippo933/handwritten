function isPrototype(value) {
  const Ctor = value && value.constructor
  const proto = (typeof Ctor === 'function' && Ctor.prototype) || Object.prototype
  return value === proto
}

module.exports = isPrototype
