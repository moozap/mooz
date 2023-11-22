
function createTimerWebWorker() {
  let timerId = 0

  const callbacks = {}
  const url = URL.createObjectURL(
    new Blob(
      [
        `
var timerIds = {}, _ = {};

_.setInterval = function(args) {
  timerIds[args.timerId] = setInterval(function() { postMessage(args.timerId); }, args.delay);
};

_.clearInterval = function(args) {
  clearInterval(timerIds[args.timerId]);
};

_.setTimeout = function(args) {
  timerIds[args.timerId] = setTimeout(function() { postMessage(args.timerId); }, args.delay);
};

_.clearTimeout = function(args) {
  clearTimeout(timerIds[args.timerId]);
};

onmessage = function(e) { _[e.data.type](e.data) };
`,
      ],
      {
        type: 'text/javascript',
      }
    )
  )

  const timerProcess = new Worker(url)

  URL.revokeObjectURL(url)

  timerProcess.onmessage = function (e) {
    if (callbacks[e.data]) {
      callbacks[e.data].callback.apply(null, callbacks[e.data].params)
    }
  }

  return {
    setInterval: function (callback, delay) {
      const params = Array.prototype.slice.call(arguments, 2)

      timerId += 1

      timerProcess.postMessage({
        type: 'setInterval',
        timerId,
        delay,
      })

      callbacks[timerId] = {
        callback,
        params,
      }

      return timerId
    },
    setTimeout: function (callback, delay, ...params) {
      timerId++

      timerProcess.postMessage({
        type: 'setTimeout',
        timerId,
        delay,
      })

      callbacks[timerId] = {
        callback,
        params,
      }

      return timerId
    },
    clearInterval: function (timerId) {
      timerProcess.postMessage({
        type: 'clearInterval',
        timerId,
      })

      delete callbacks[timerId]
    },
    clearTimeout: function (timerId) {
      timerProcess.postMessage({
        type: 'clearTimeout',
        timerId,
      })

      delete callbacks[timerId]
    },
  }
}

// Server-side
function createMockTimerWorker() {
  return ['setInterval', 'setTimeout', 'clearInterval', 'clearTimeout'].reduce(
    (obj, key) => {
      // @ts-ignore
      obj[key] = global[key]
      return obj
    },
    {}
  )
}

const createTimerWorker =
  typeof window !== 'undefined' ? createTimerWebWorker : createMockTimerWorker

export default createTimerWorker
