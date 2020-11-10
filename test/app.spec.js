const knex = require("knex");
const app = require("../src/app");
const { makeTestBookmarks } = require("./bookmarks.fixtures");

describe("App", () => {
  it('GET / responds with 200 containing "Hello, world!"', () => {
    return supertest(app)
      .get("/")
      .set("Authorization", "Bearer " + process.env.API_TOKEN)
      .expect(200, "Hello, world!");
  });

  describe("Bookmarks endpoints", () => {
    let db;

    before("make knex instance", () => {
      db = knex({
        client: "pg",
        connection: process.env.TEST_DB_URL,
      });
      app.set("db", db);
    });

    before("clean the table at start", () => db("bookmarks").truncate());

    afterEach("clean the table after each test", () =>
      db("bookmarks").truncate()
    );

    after("disconnect from db", () => db.destroy());

    describe("GET /bookmarks", () => {
      context("with no bookmarks in the database", () => {
        it("responds with 200 and an empty list", () => {
          return supertest(app)
            .get("/bookmarks")
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, []);
        });
      });

      context("with bookmarks in the database", () => {
        const testBookmarks = makeTestBookmarks();

        beforeEach("insert bookmarks", () => {
          return db.into("bookmarks").insert(testBookmarks);
        });

        it("responds with 200 and all of the bookmarks", () => {
          return supertest(app)
            .get("/bookmarks")
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, testBookmarks);
        });
      });
    });

    describe("GET /bookmarks/:id", () => {
      context("with no bookmarks in the database", () => {
        it("responds with 404", () => {
          const bookmarkId = 123456789;
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(404, { error: { message: "Bookmark not found" } });
        });
      });

      context("with bookmarks in the database", () => {
        const testBookmarks = makeTestBookmarks();

        beforeEach("insert bookmarks", () => {
          return db.into("bookmarks").insert(testBookmarks);
        });

        it("it responds with 200 and the specific bookmark", () => {
          const bookmarkId = 3;
          const expectedBookmark = testBookmarks[bookmarkId - 1];
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, expectedBookmark);
        });
      });
    });
  });
});
