const express = require("express");
const { v4: uuid } = require("uuid");
const { isWebUri } = require("valid-url");
const logger = require("../logger");

const bookmarks = [];

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route("/bookmarks")
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    for (const field of ["title", "url"]) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send(`${field} is required`);
      }
    }

    const { title, url, description, rating = 1 } = req.body;

    if (!isWebUri(url)) {
      logger.error(`Invalid URL given: ${url}`);
      return res.status(400).send("invalid URL supplied");
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating of '${rating}' supplied`);
      return res.status(400).send("Rating must be a number between 0 and 5");
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating,
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarksRouter
  .route("/bookmarks/:id")
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find((b) => b.id == id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send("Bookmark not found");
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex((b) => b.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send("Bookmark not found");
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted`);

    res.status(204).end();
  });

module.exports = bookmarksRouter;
