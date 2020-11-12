const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select("*").from("bookmarks");
  },

  getById(knex, id) {
    return knex.select("*").from("bookmarks").where("id", id).first();
  },

  addBookmark(knex, newBookmark) {
    // TODO
    return knex
      .insert(newBookmark)
      .into("bookmarks")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },

  deleteBookmark(knex, id) {
    // TODO
    // return knex.from("bookmarks").where({ id }).delete();
    return knex("bookmarks").where({ id }).delete();
  },

  updateBookmark(knex, id, newBookmarkFields) {
    // TODO
    return knex("bookmarks").where({ id }).update(newBookmarkFields);
  },
};

module.exports = BookmarksService;
