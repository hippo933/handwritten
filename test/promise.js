const MyPromise = require('./../promise.js')
const promisesAPlusTests = require('promises-aplus-tests')

promisesAPlusTests(MyPromise, function (err) {
  console.log(err)
})
