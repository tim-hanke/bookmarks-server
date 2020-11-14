const path = require("path");
const express = require("express");
const { isWebUri } = require("valid-url");
const xss = require("xss");
const logger = require("../logger");
const BookmarksService = require("./bookmarks-service");
const bookmarkValidator = require("./bookmarks-validator");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const sanitizeBookmark = (bookmark) => ({
  ...bookmark,
  title: xss(bookmark.title),
  description: xss(bookmark.description),
});

bookmarksRouter
  .route("/")
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

    const { title, url, description, rating } = req.body;

    const bookmark = {
      title,
      url,
      description,
      rating,
    };

    const error = bookmarkValidator(bookmark);

    if (error) return res.status(400).json(error);

    BookmarksService.addBookmark(req.app.get("db"), sanitizeBookmark(bookmark))
      .then((bookmark) => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  })
  .patch((req, res, next) => {
    // I put this under '/api/bookmarks' route so that a helpful error
    // message can be dispayed if a PATCH attempt is made without
    // providing a bookmark id as URL param
    // I'm not sure if this 'semantically' correct
    if (!req.params.id) {
      return res.status(404).json({
        error: {
          message: `bookmark id must be supplied '/api/bookmarks/{id}'`,
        },
      });
    }
  });

bookmarksRouter
  .route("/:id")
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
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;

    if (!req.params.id) {
      return res.status(400).json({
        error: {
          message: `bookmark id must be supplied '/api/bookmarks/{id}'`,
        },
      });
    }

    // in creating this object, I'm also attempting to sanitize the
    // inputs against cross site scripting attempts
    const bookmarkToUpdate = {
      title: title ? xss(title) : title,
      url,
      description: description ? xss(description) : description,
      rating,
    };

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message:
            "Request body must contain either 'title', 'url', 'description' or 'rating'",
        },
      });
    }

    const error = bookmarkValidator(bookmarkToUpdate);

    if (error) return res.status(400).json(error);

    BookmarksService.updateBookmark(
      req.app.get("db"),
      req.params.id,
      bookmarkToUpdate
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;
