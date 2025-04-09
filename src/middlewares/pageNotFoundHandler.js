const pageNotFoundHandler = (req, res, next) => {
  // catch 404 and forward to error handler
  // 404 route error is different from 500 error handler
  res.status(404).json({
    status: 'fail',
    message: 'Page not found',
  });
};

export default pageNotFoundHandler;
