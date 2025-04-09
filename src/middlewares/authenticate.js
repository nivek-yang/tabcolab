import passport from '../../config/passport.js';

const authenticateJwt = (req, res, next) => {
  const token = req.headers.authorization;

  // 檢查請求頭中是否包含 JWT
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).send({ status: 'fail', message: 'Missing JWT' });
  }

  passport.authenticate('jwt', { session: false }, (err, user) => {
    // 如果出現錯誤，或者未找到用戶，返回 401 錯誤
    if (err || !user) {
      return res.status(401).send({ status: 'fail', message: 'Invalid JWT' });
    }

    // 如果身份驗證成功，將用戶資訊存儲在 req.user 中，並繼續處理下一個中間件或路由處理程序
    req.user = user;
    next();
  })(req, res, next);
};

const authenticateAdmin = (req, res, next) => {
  // 檢查用戶的電子郵件是否為 'admin123@gmail.com'
  if (req.user.email !== 'admin123@gmail.com') {
    return res.status(403).send({ status: 'fail', message: 'Access denied. You are not an admin.' });
  }

  next();
};

export { authenticateJwt, authenticateAdmin };
