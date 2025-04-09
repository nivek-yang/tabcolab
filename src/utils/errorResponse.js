const errorResponse = (res, statusCode, message) => {
  const status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  res.status(statusCode).json({ status, message });
};

export default errorResponse;
