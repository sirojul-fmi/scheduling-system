/**
 * Worker Thread for running Genetic Algorithm
 * Receives input via parentPort.on('message')
 * Sends progress updates back via parentPort.postMessage
 */

const { workerData, parentPort } = require('worker_threads');
const { runGA } = require('./ga');

const { inputData, params, jobId } = workerData;

try {
  const result = runGA(inputData, params, (logEntry) => {
    // Send progress update to main thread
    parentPort.postMessage({
      type: 'progress',
      jobId,
      ...logEntry,
    });
  });

  parentPort.postMessage({
    type: 'done',
    jobId,
    result,
  });
} catch (error) {
  parentPort.postMessage({
    type: 'error',
    jobId,
    error: error.message,
  });
}
