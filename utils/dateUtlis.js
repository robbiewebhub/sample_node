const getDateDaysDiff = (date) => {
  const givenDate = new Date(date);

  const currentDate = new Date();

  const differenceInMilliseconds = currentDate - givenDate;

  const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);

  return differenceInDays;
};

const getBirthdayRange = (age) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const latestBirthYear = currentYear - age;

  const earliestBirthYear = latestBirthYear - 1;

  const latestBirthday = new Date(
    latestBirthYear,
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const earliestBirthday = new Date(
    earliestBirthYear,
    currentDate.getMonth(),
    currentDate.getDate() + 1
  );

  return {
    earliest: `${earliestBirthday.getFullYear()}-${(
      earliestBirthday.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${earliestBirthday
      .getDate()
      .toString()
      .padStart(2, "0")}`,
    latest: `${latestBirthday.getFullYear()}-${(latestBirthday.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${latestBirthday
      .getDate()
      .toString()
      .padStart(2, "0")}`,
  };
};

module.exports = { getDateDaysDiff, getBirthdayRange };
