const express = require("express");
const { isWebUri } = require("valid-url");
const xss = require("xss");
const logger = require("../logger");
const BookmarksService = require("./bookmarks-service");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const sanitizeBookmark = (bookmark) => ({
  ...bookmark,
  title: xss(bookmark.title),
  description: xss(bookmark.description),
});

bookmarksRouter
  .route("/")
  .get((req, res, next) => res.status(200).send("Hello, world!"));

bookmarksRouter
  .route("/bookmarks")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmarks) => {
        res.json(bookmarks.map(sanitizeBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    for (const field of ["title", "url", "rating"]) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).json({
          error: { message: `'${field}' is required` },
        });
      }
    }

    const { title, url, description, rating = 1 } = req.body;

    console.log(url);

    if (!isWebUri(url)) {
      logger.error(`Invalid URL given: ${url}`);
      return res.status(400).json({
        error: { message: "'url' must be a valid URL" },
      });
    }
    const ratingNum = Number(rating);

    if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      logger.error(`Invalid rating of '${rating}' supplied`);
      return res.status(400).json({
        error: { message: "'rating' must be a number between 0 and 5" },
      });
    }

    const bookmark = {
      title,
      url,
      description,
      rating,
    };

    BookmarksService.addBookmark(req.app.get("db"), sanitizeBookmark(bookmark))
      .then((bookmark) => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res.status(201).location(`/bookmarks/${bookmark.id}`).json(bookmark);
      })
      .catch(next);
  });

bookmarksRouter
  .route("/bookmarks/:id")
  .all((req, res, next) => {
    BookmarksService.getById(req.app.get("db"), req.params.id)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: "Bookmark doesn't exist" },
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.status(200).json(sanitizeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(req.app.get("db"), req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;
