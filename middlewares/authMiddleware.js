const authMiddleware = (req, res, next) => {
  req.userId = req.query.userId;
  console.log(req.body);
  next();
};

module.exports = {
  authMiddleware,
};
