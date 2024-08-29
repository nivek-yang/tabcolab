function handleAndRethrowException(response, e) {
  let customErrorMessage;
  if (response && response.body && Object.keys(response.body).length > 0) {
    customErrorMessage = `Actual Response Body:\n ${JSON.stringify(response.body, null, 2)}\n \n ${e.message}`;
  } else {
    customErrorMessage = `Actual Result Difference:\n ${JSON.stringify(response, null, 2)}\n \n ${e.message}`;
  }
  throw new Error(customErrorMessage); // 重新抛出异常
}

module.exports = { handleException: handleAndRethrowException };
