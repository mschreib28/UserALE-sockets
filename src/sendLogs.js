/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Initializes the log queue processors.
 * @param  {Array} logs   Array of logs to append to.
 * @param  {Object} config Configuration object to use when logging.
 */
export function initSender(logs, config) {
  let sendLogs = config.useSockets ? sendLogsOverSockets : sendLogsOverPost;
  sendOnInterval(logs, config, sendLogs);
  sendOnClose(logs, config, sendLogs);
}

/**
 * Checks the provided log array on an interval, flushing the logs
 * if the queue has reached the threshold specified by the provided config.
 * @param  {Array} logs   Array of logs to read from.
 * @param  {Object} config Configuration object to be read from.
 * @param {Function} sendLogs Function for sending logs
 */
export function sendOnInterval(logs, config, sendLogs) {
  setInterval(function() {
    if (logs.length >= config.logCountThreshold) {
      sendLogs(logs.slice(0), config.url, config.retries); // Send a copy
      logs.splice(0); // Clear array reference (no reassignment)
    }
  }, config.transmitInterval);
}

/**
 * Attempts to flush the remaining logs when the window is closed.
 * @param  {Array} logs   Array of logs to be flushed.
 * @param  {Object} config Configuration object to be read from.
 * @param {Function} sendLogs Function for sending logs
 */
export function sendOnClose(logs, config, sendLogs) {
  if (navigator.sendBeacon) {
    window.addEventListener('unload', function() {
      navigator.sendBeacon(config.url, JSON.stringify(logs));
    });
  } else {
    window.addEventListener('beforeunload', function() {
      if (logs.length > 0) {
        sendLogs(logs, config.url, 1);
      }
    })
  }
}

/**
 * Sends the provided array of logs to the specified url,
 * retrying the request up to the specified number of retries.
 * @param  {Array} logs    Array of logs to send.
 * @param  {string} url     URL to send the POST request to.
 * @param  {Number} retries Maximum number of attempts to send the logs.
 */
export function sendLogsOverPost(logs, url, retries) {
  let data = JSON.stringify(logs);
  let req = new XMLHttpRequest();

  req.open('POST', url);
  req.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

  req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status !== 200) {
      if (retries > 0) {
        sendLogsOverPost(logs, url, retries--);
      }
    }
  };

  req.send(data);
}

/**
 * Sends the provided array of logs to the specified url,
 * retrying the request up to the specified number of retries.
 * @param  {Array} logs    Array of logs to send.
 * @param  {string} url     URL to send the POST request to.
 * @param  {Number} retries Maximum number of attempts to send the logs.
 */
export function sendLogsOverSockets(logs, url, retries) {
  let data = JSON.stringify(logs);

  io.emit(config.socketChannel, JSON.stringify(log));
  req.open('POST', url);
  req.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

  req.onreadystatechange = function() {
    if (req.readyState === 4 && req.status !== 200) {
      if (retries > 0) {
        sendLogsOverSockets(logs, url, retries--);
      }
    }
  };

  req.send(data);
}