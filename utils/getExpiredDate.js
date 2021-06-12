const getExpiredDate = (date, expiresIn) => {
  const _date = new Date(date);
  _date.setTime(_date.getTime() + expiresIn);

  return _date;
};

module.exports = {
  getExpiredDate,
};
