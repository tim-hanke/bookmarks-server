const express = require("express");
const { NODE_ENV } = require("./config");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const validateBearerToken = require("./validate-bearer-token");
const bookmarksRouter = require("./bookmarks/bookmarks-router");
const errorHandler = require("./error-handler");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(validateBearerToken);

app.use("/api/bookmarks", bookmarksRouter);

app.get("/", (req, res) => res.status(200).send("Hello, world!"));

app.use(errorHandler);

module.exports = app;
