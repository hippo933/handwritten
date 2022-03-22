const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }
  let called
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(
          x,
          (y) => {
            if (called) return
            called = true
            resolvePromise(promise2, y, resolve, reject)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    resolve(x)
  }
}

class MyPromise {
  constructor(executor) {
    this.status = PENDING
    this.value = undefined
    this.reason = undefined

    this.successCallbacks = []
    this.failCallbacks = []

    const resolve = (value) => {
      if (this.status !== PENDING) return
      this.value = value
      this.status = FULFILLED
      while (this.successCallbacks.length) {
        this.successCallbacks.shift()()
      }
    }
    const reject = (reason) => {
      if (this.status !== PENDING) return
      this.reason = reason
      this.status = REJECTED
      while (this.failCallbacks.length) {
        this.failCallbacks.shift()()
      }
    }

    executor(resolve, reject)
  }

  then(onSuccessCallback, onFailCallback) {
    onSuccessCallback = typeof onSuccessCallback === 'function' ? onSuccessCallback : (value) => value
    onFailCallback =
      typeof onFailCallback === 'function'
        ? onFailCallback
        : (reason) => {
            throw reason
          }
    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            const x = onSuccessCallback(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      } else if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            const x = onFailCallback(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      } else {
        this.successCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onSuccessCallback(this.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        this.failCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFailCallback(this.reason)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return promise2
  }

  catch(callback) {
    return this.then(undefined, callback)
  }

  finally(callback) {
    return this.then(
      (value) => {
        return MyPromise.resolve(callback()).then(() => value)
      },
      (reason) => {
        return MyPromise.resolve(callback()).then(() => {
          throw reason
        })
      }
    )
  }

  static resolve(value) {
    return new MyPromise((resolve) => {
      resolve(value)
    })
  }

  static reject(reason) {
    return new MyPromise((_, reject) => {
      reject(reason)
    })
  }

  static all(array) {
    if (!Array.isArray(array)) {
      return new TypeError(`TypeError: ${type} ${values} is not iterable`)
    }
    return MyPromise((resolve, reject) => {
      const result = []
      let index = 0
      function addData(key, value) {
        index++
        result[key] = value
        if (index === result.length) {
          resolve(result)
        }
      }
      for (let i = 0; i < array.length; i++) {
        const current = array[i]

        if (current instanceof MyPromise) {
          current.then(
            (value) => addData(i, value),
            (reason) => reject(reason)
          )
        } else {
          addData(i, current)
        }
      }
    })
  }

  static race(array) {
    if (!Array.isArray(array)) {
      return new TypeError(`TypeError: ${type} ${values} is not iterable`)
    }

    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < array.length; i++) {
        const current = array[i]
        if (current instanceof MyPromise) {
          current.then(resolve, reject)
        } else {
          resolve(current)
        }
      }
    })
  }

  static allSettled(array) {
    if (!Array.isArray(array)) {
      return new TypeError(`TypeError: ${type} ${values} is not iterable`)
    }

    return new MyPromise((resolve) => {
      const result = []
      let index = 0

      function addData(key, value, status) {
        index++
        if (status === FULFILLED) {
          result[key] = {
            status,
            value,
          }
        } else {
          result[key] = {
            status,
            reason: value,
          }
        }
        if (index === result.length) {
          resolve(result)
        }
      }

      for (let index = 0; index < array.length; index++) {
        const current = array[index]
        if (current instanceof MyPromise) {
          current.then(
            (value) => addData(i, value, FULFILLED),
            (reason) => addData(i, reason, REJECTED)
          )
        } else {
          addData(i, value, FULFILLED)
        }
      }
    })
  }

  static any(array) {
    if (!Array.isArray(array)) {
      return new TypeError(`TypeError: ${type} ${values} is not iterable`)
    }

    return new MyPromise((resolve, reject) => {
      const result = []
      let index = 0

      function addData(key, value) {
        index++
        result[key] = value
        if (index === result.length) {
          reject(result)
        }
      }

      for (let index = 0; index < array.length; index++) {
        const current = array[index]
        if (current instanceof MyPromise) {
          current.then(
            (value) => resolve(value),
            (reason) => addData(i, reason)
          )
        } else {
          resolve(value)
        }
      }
    })
  }
}

MyPromise.defer = MyPromise.deferred = function () {
  let dtd = {}
  dtd.promise = new MyPromise((resolve, reject) => {
    dtd.resolve = resolve
    dtd.reject = reject
  })
  return dtd
}

module.exports = MyPromise
