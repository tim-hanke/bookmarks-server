const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("../logger");

const bookmarks = [];

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route("/bookmarks")
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating = 1 } = req.body;

    if (!title) {
      logger.error("Title is required");
      return res.status(400).send("Invalid data");
    }
    if (!url) {
      logger.error("URL is required");
      return res.status(400).send("Invalid data");
    }
    if (!description) {
      logger.error("Description is required");
      return res.status(400).send("Invalid data");
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

bookmarkRouter
  .route("/bookmarks/:id")
  .get((req, res) => {})
  .delete((req, res) => {});

module.exports = bookmarkRouter;
