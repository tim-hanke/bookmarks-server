const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select("*").from("bookmarks");
  },

  getById(knex, id) {
    return knex.select("*").from("bookmarks").where("id", id).first();
  },

  addBookmark(knex, newBookmark) {
    // TODO
  },

  deleteBookmark(knex, id) {
    // TODO
  },

  updateBookmark(knex, id, newBookmarkFields) {
    // TODO
  },
};

module.exports = BookmarksService;
