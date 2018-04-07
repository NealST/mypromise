function resolve (value) {
  let _self = this
  setTimeout(function () {
    if (_self.state === 'pending') {
      _self.state = 'fullfilled'
      _self.value = value
      _self.resolveCallbacks.forEach((item) => {
        item(_self.value)
      })
    }
  })
}
function reject (error) {
  let _self = this
  setTimeout(function () {
    if (_self.state === 'pending') {
      _self.state = 'rejected'
      _self.value = error
      // 用于处理promise调用链兜底错误提示
      if (_self.rejectCallbacks.length === 0) {
        console.error(error)
      }
      _self.rejectCallbacks.forEach((item) => {
        item(_self.value)
      })
    }
  })
}
// 用于结束promise
function end () {
  return new Promise(function () {})
}
// 遵循promise/A+规范的promise解析过程
function promiseResolve (newpromise, x, resolve, reject) {
  if (newpromise === x) {
    return reject(new TypeError('promise has been detected'))
  }
  if (x instanceof Promise) {
    return x.then(resolve, reject)
  }
  if ((x !== null) && (typeof x === 'function' || typeof x === 'object')) {
    let calledOrThrowThen = false
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(x, function (y) {
          if (calledOrThrowThen) return
          calledOrThrowThen = true
          return promiseResolve(newpromise, y, resolve, reject)
        }, function (r) {
          if (calledOrThrowThen) return
          calledOrThrowThen = true
          reject(r)
        })
      } else {
        return resolve(x)
      }
    } catch (e) {
      if (calledOrThrowThen) return
      calledOrThrowThen = true
      return reject(e)
    }
  } else {
    return resolve(x)
  }
}
function parseResult (type, onFullfilled, onRejected) {
  let _self = this
  let newpromise = new Promise(function (resolve, reject) {
    // 异步处理onFullfilled与onRejected
    setTimeout(function () {
      try {
        let onRes = type === 'resolve' ? onFullfilled(_self.value) : onRejected(_self.value)
        promiseResolve(newpromise, onRes, resolve, reject)
      } catch (e) {
        reject(e)
      }
    })
  })
  return newpromise
}
function processThenFill (onFullfilled, onRejected) {
  return parseResult.call(this, 'resolve', onFullfilled, onRejected)
}
function processThenReject (onFullfilled, onRejected) {
  return parseResult.call(this, 'reject', onFullfilled, onRejected)
}
function processThenPending (onFullfilled, onRejected) {
  let _self = this
  return new Promise(function (resolve, reject) {
    _self.resolveCallbacks.push(function () {
      parseResult.call(_self, 'resolve', onFullfilled, onRejected, resolve, reject)
    })
    _self.rejectCallbacks.push(function () {
      parseResult.call(_self, 'reject', onFullfilled, onRejected, resolve, reject)
    })
  })
}

export default class Promise {
  constructor (fn) {
    this.state = 'pending'
    this.value = ''
    this.resolveCallbacks = []
    this.rejectCallbacks = []
    if (typeof fn !== 'function') {
      throw new Error('promise constructor must accept a function type param')
    }
    try {
      fn.call(this, resolve.bind(this), reject.bind(this))
    } catch (e) {
      reject.call(this, e)
    }
  }
  then (onFullfilled, onRejected) {
    onFullfilled = onFullfilled && (typeof onFullfilled === 'function') ? onFullfilled : (value) => value
    onRejected = onRejected && (typeof onRejected === 'function') ? onRejected : (error) => { throw new Error(error) }
    if (this.state === 'fullfilled') {
      return processThenFill.call(this, onFullfilled, onRejected)
    }
    if (this.state === 'rejected') {
      return processThenReject.call(this, onFullfilled, onRejected)
    }
    if (this.state === 'pending') {
      return processThenPending.call(this, onFullfilled, onRejected)
    }
  }
  catch (onRejected) {
    return this.then(null, onRejected)
  }
  end () {
    return end()
  }
  static resolve (value) {
    
  }
  static race (promiseArrays) {
    
  }
  static all (promiseArrays) {
    
  }
}
