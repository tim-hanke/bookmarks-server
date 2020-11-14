const { isWebUri } = require("valid-url");
const logger = require("../logger");

function bookmarkValidator({ url, rating }) {
  if (url && !isWebUri(url)) {
    logger.error(`Invalid URL given: ${url}`);
    return {
      error: { message: "'url' must be a valid URL" },
    };
  }

  if (rating && (!Number.isInteger(rating) || rating < 0 || rating > 5)) {
    logger.error(`Invalid rating of '${rating}' supplied`);
    return {
      error: { message: "'rating' must be a number between 0 and 5" },
    };
  }

  // if neither of those error catchers is triggered,
  // return null
  return null;
}

module.exports = bookmarkValidator;
