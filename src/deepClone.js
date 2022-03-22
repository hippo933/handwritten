const isObject = require('./../helper/isObject')
const isPrototype = require('./../helper/isPrototype.js')

const argsTag = '[object Arguments]'
const arrayTag = '[object Array]'
const boolTag = '[object Boolean]'
const dateTag = '[object Date]'
const errorTag = '[object Error]'
const mapTag = '[object Map]'
const numberTag = '[object Number]'
const objectTag = '[object Object]'
const regexpTag = '[object RegExp]'
const setTag = '[object Set]'
const stringTag = '[object String]'
const symbolTag = '[object Symbol]'
const weakMapTag = '[object WeakMap]'

function getTag(target) {
  return Object.prototype.toString.call(target)
}

function initCloneByTag(target, type) {
  const Ctor = target.constructor
  switch(type) {
    case boolTag:
    case dateTag:
      return new Ctor(+target)

    case numberTag:
    case stringTag:
      return new Ctor(target)

    case symbolTag:
      return initSymbol(target)
    
    case setTag:
    case mapTag:
      return new Ctor

    case regexpTag:
      return new initRegexp(target)
  }
}

function initSymbol(symbol) {
  return Object(Symbol.prototype.valueOf.call(symbol))
}

function initRegexp(regexp) {
  const reFlags = /\w*$/
  const result = new regexp.constructor(regexp.source, reFlags.exec(regexp))
  result.lastIndex = regexp.lastIndex
  return result
}

function initArray(array) {
  const length = array.length
  const result = new array.constructor(length)

  if (length && typeof array[0] === 'string' && Object.prototype.hasOwnProperty.call(array, 'index')) {
    result.index = array.index
    result.input = array.input
  }

  return result
}

function initObject(object) {
  return (typeof object.constructor === 'function' && !isPrototype) ? Object.create(Object.getPrototypeOf(object)) : {}
}

function arrayEach(array, iteratee) {
  const length = array.length
  let index = -1
  while(++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break
    }
  }
  return array
}

function deepClone(value, hashMap = new WeakMap) {
  if (!isObject(value)) {
    return value
  }

  const isFunc = typeof value === 'function'
  const isArr = Array.isArray(value)
  const tag = getTag(value)
  let cloneTarget

  if (isArr) {
    cloneTarget = initArray(value)
  } else if (isFunc) {
    return value
  } else {
    if (tag === objectTag || tag === argsTag) {
      cloneTarget = initObject(value)
    } else {
      cloneTarget = initCloneByTag(tag, value)
    }
  }

  if (hashMap.has(cloneTarget)) {
    return hashMap(cloneTarget)
  }

  hashMap.set(value, cloneTarget)

  if (tag === mapTag) {
    value.forEach((val, key) => {
      cloneTarget.set(key, val)
    }) 
    return cloneTarget
  }

  if (tag === setTag) {
    value.forEach(val => {
      cloneTarget.add(val)
    })
    return cloneTarget
  }

  const keys = isArr ? undefined : Object.keys(value)

  arrayEach(keys || value, (val, key) => {
    if (keys) {
      key = val
      val = value[key]
    }
    cloneTarget[key] = val
  })

  return cloneTarget
}

module.exports = deepClone
