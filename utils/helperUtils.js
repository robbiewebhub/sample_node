const getSumOfAgeCount = (startAge, endAge, data) => {
  return data.reduce((acc, val) => {
    const count = +val.get("count");
    const age = val.get("age");
    if (endAge == "" && age >= startAge) {
      acc += count;
    } else if (age >= startAge && age <= endAge) {
      acc += count;
    }

    return acc;
  }, 0);
};

module.exports = {
  getSumOfAgeCount,
};
