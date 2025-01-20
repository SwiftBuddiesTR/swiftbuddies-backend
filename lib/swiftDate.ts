/**
 * Converts a given Date object to a string in the ISO 8601 format with UTC time.
 *
 * The output format is "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", where:
 * - `yyyy` is the 4-digit year
 * - `MM` is the 2-digit month (01-12)
 * - `dd` is the 2-digit day of the month (01-31)
 * - `HH` is the 2-digit hour in 24-hour format (00-23)
 * - `mm` is the 2-digit minute (00-59)
 * - `ss` is the 2-digit second (00-59)
 * - `SSS` is the 3-digit millisecond (000-999)
 * - The literal 'T' separates the date and time components
 * - The literal 'Z' indicates that the time is in UTC
 */

/**
 * Converts a given Date object to a string in the ISO 8601 format with UTC time.
 * @param {Date} date - The Date object to convert
 * @returns {string} - The date and time as a string in the ISO 8601 format
  */
function DateTimeToString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');

  // Format the date and time as "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  return formattedDate;
}

/*
 * Converts a given string to a Date object.
 * @param {string} str - The string to convert
 * @returns {{ error: boolean; date: Date | null }} - An object containing the error status and the Date object
 */
function StringToDateTime(str: string): { error: boolean; date: Date | null } {
  const date = new Date(str);

  if (isNaN(date.getTime())) {
    return {
      error: true,
      date: null,
    };
  }

  return {
    error: false,
    date,
  };
}

export { DateTimeToString, StringToDateTime };