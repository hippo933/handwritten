function isObject(target) {
  return (typeof target === 'object' || typeof target === 'function') && target !== null
}

module.exports = isObject
