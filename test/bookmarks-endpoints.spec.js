const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const {
  makeTestBookmarks,
  makeMaliciousBookmark,
} = require("./bookmarks.fixtures");

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

    describe(`Unauthorized requests`, () => {
      const testBookmarks = makeTestBookmarks();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it(`responds with 401 Unauthorized for GET /api/bookmarks`, () => {
        return supertest(app)
          .get("/api/bookmarks")
          .expect(401, { error: "Unauthorized request" });
      });

      it(`responds with 401 Unauthorized for POST /api/bookmarks`, () => {
        return supertest(app)
          .post("/api/bookmarks")
          .send({
            title: "test-title",
            url: "http://some.thing.com",
            rating: 1,
          })
          .expect(401, { error: "Unauthorized request" });
      });

      it(`responds with 401 Unauthorized for GET /api/bookmarks/:id`, () => {
        const secondBookmark = testBookmarks[1];
        return supertest(app)
          .get(`/api/bookmarks/${secondBookmark.id}`)
          .expect(401, { error: "Unauthorized request" });
      });

      it(`responds with 401 Unauthorized for DELETE /api/bookmarks/:id`, () => {
        const aBookmark = testBookmarks[1];
        return supertest(app)
          .delete(`/api/bookmarks/${aBookmark.id}`)
          .expect(401, { error: "Unauthorized request" });
      });
    });

    describe("GET /api/bookmarks", () => {
      context("with no bookmarks in the database", () => {
        it("responds with 200 and an empty list", () => {
          return supertest(app)
            .get("/api/bookmarks")
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
            .get("/api/bookmarks")
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, testBookmarks);
        });
      });

      context(`Given an XSS attack bookmark`, () => {
        const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

        beforeEach("insert malicious bookmark", () => {
          return db.into("bookmarks").insert([maliciousBookmark]);
        });

        it("removes XSS attack content", () => {
          return supertest(app)
            .get(`/api/bookmarks`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect((res) => {
              expect(res.body[0].title).to.eql(expectedBookmark.title);
              expect(res.body[0].description).to.eql(
                expectedBookmark.description
              );
            });
        });
      });
    });

    describe("POST /api/bookmarks", () => {
      it(`responds with 400 missing 'title' if not supplied`, () => {
        const newBookmarkMissingTitle = {
          // title: 'test-title',
          url: "https://test.com",
          rating: 1,
        };
        return supertest(app)
          .post(`/api/bookmarks`)
          .send(newBookmarkMissingTitle)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'title' is required` },
          });
      });

      it(`responds with 400 missing 'url' if not supplied`, () => {
        const newBookmarkMissingUrl = {
          title: "test-title",
          // url: 'https://test.com',
          rating: 1,
        };
        return supertest(app)
          .post(`/api/bookmarks`)
          .send(newBookmarkMissingUrl)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'url' is required` },
          });
      });

      it(`responds with 400 missing 'rating' if not supplied`, () => {
        const newBookmarkMissingRating = {
          title: "test-title",
          url: "https://test.com",
          // rating: 1,
        };
        return supertest(app)
          .post(`/api/bookmarks`)
          .send(newBookmarkMissingRating)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'rating' is required` },
          });
      });

      it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
        const newBookmarkInvalidRating = {
          title: "test-title",
          url: "https://test.com",
          rating: "invalid",
        };
        return supertest(app)
          .post(`/api/bookmarks`)
          .send(newBookmarkInvalidRating)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'rating' must be a number between 0 and 5` },
          });
      });

      it(`responds with 400 invalid 'url' if not a valid URL`, () => {
        const newBookmarkInvalidUrl = {
          title: "test-title",
          url: "htp://invalid-url",
          rating: 1,
        };
        return supertest(app)
          .post(`/api/bookmarks`)
          .send(newBookmarkInvalidUrl)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `'url' must be a valid URL` },
          });
      });

      it("creates a bookmark, responding with 201 and the new article", function () {
        const newBookmark = {
          title: "Test new title",
          url: "https://www.google.com",
          description: "Test new description",
          rating: 5,
        };
        return supertest(app)
          .post("/api/bookmarks")
          .send(newBookmark)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(201)
          .expect((res) => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body).to.have.property("id");
            expect(res.headers.location).to.eql(
              `/api/bookmarks/${res.body.id}`
            );
          })
          .then((postRes) =>
            supertest(app)
              .get(`/api/bookmarks/${postRes.body.id}`)
              .set("Authorization", "Bearer " + process.env.API_TOKEN)
              .expect(postRes.body)
          );
      });

      it("removes XSS attack content from response", () => {
        const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
        return supertest(app)
          .post(`/api/bookmarks`)
          .send(maliciousBookmark)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });

    describe("GET /api/bookmarks/:id", () => {
      context("with no bookmarks in the database", () => {
        it("responds with 404", () => {
          const bookmarkId = 123456789;
          return supertest(app)
            .get(`/api/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(404, { error: { message: "Bookmark doesn't exist" } });
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
            .get(`/api/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, expectedBookmark);
        });
      });

      context(`Given an XSS attack bookmark`, () => {
        const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

        beforeEach("insert malicious bookmark", () => {
          return db.into("bookmarks").insert([maliciousBookmark]);
        });

        it("removes XSS attack content", () => {
          return supertest(app)
            .get(`/api/bookmarks/${maliciousBookmark.id}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect((res) => {
              expect(res.body.title).to.eql(expectedBookmark.title);
              expect(res.body.description).to.eql(expectedBookmark.description);
            });
        });
      });
    });

    describe(`DELETE /bookmark/:bookmark_id`, () => {
      context("Given no bookmarks", () => {
        it("responds with 404", () => {
          const bookmarkId = 123456789;
          return supertest(app)
            .delete(`/api/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(404, { error: { message: `Bookmark doesn't exist` } });
        });
      });

      context("Given there are bookmarks in the database", () => {
        const testBookmarks = makeTestBookmarks();

        beforeEach("insert bookmarks", () => {
          return db.into("bookmarks").insert(testBookmarks);
        });

        it("responds with 204 and removes the bookmark", () => {
          const idToRemove = 2;
          const expectedBookmarks = testBookmarks.filter(
            (bookmark) => bookmark.id !== idToRemove
          );
          return supertest(app)
            .delete(`/api/bookmarks/${idToRemove}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(204)
            .then(() =>
              supertest(app)
                .get(`/api/bookmarks`)
                .set("Authorization", "Bearer " + process.env.API_TOKEN)
                .expect(expectedBookmarks)
            );
        });
      });
    });

    describe("PATCH /api/bookmarks/:id", () => {
      context("Given no bookmarks", () => {
        it("responds with 404", () => {
          const bookmarkId = 123456789;
          return supertest(app)
            .patch(`/api/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(404, { error: { message: `Bookmark doesn't exist` } });
        });
      });

      context("Given there are bookmarks in the database", () => {
        const testBookmarks = makeTestBookmarks();

        beforeEach("insert bookmarks", () => {
          return db.into("bookmarks").insert(testBookmarks);
        });

        it("responds with 404 if bookmark with id does not exist", () => {
          const bookmarkId = 123456789;
          return supertest(app)
            .patch(`/api/bookmarks/${bookmarkId}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(404, { error: { message: `Bookmark doesn't exist` } });
        });

        it("responds with 404 if no bookmark id is given as URL param", () => {
          return supertest(app)
            .patch(`/api/bookmarks`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(404, {
              error: {
                message: `bookmark id must be supplied '/api/bookmarks/{id}'`,
              },
            });
        });

        it(`responds with 400 when no required fields supplied`, () => {
          const idToUpdate = 2;
          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .send({ irrelevantField: "foo" })
            .expect(400, {
              error: {
                message:
                  "Request body must contain either 'title', 'url', 'description' or 'rating'",
              },
            });
        });

        it(`responds with 400 invalid 'url' if not a valid URL`, () => {
          const bookmarkIdToUpdate = 2;
          const bookmarkInvalidUrl = {
            url: "htp://invalid-url",
          };
          return supertest(app)
            .patch(`/api/bookmarks/${bookmarkIdToUpdate}`)
            .send(bookmarkInvalidUrl)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: { message: `'url' must be a valid URL` },
            });
        });

        it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
          const bookmarkIdToUpdate = 2;
          const bookmarkInvalidRating = {
            rating: "invalid",
          };
          return supertest(app)
            .patch(`/api/bookmarks/${bookmarkIdToUpdate}`)
            .send(bookmarkInvalidRating)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: { message: `'rating' must be a number between 0 and 5` },
            });
        });

        it("responds with 204 and updates database when given a complete bookmark", () => {
          const idToUpdate = 2;
          const bookmarkToUpdate = {
            title: "updated title",
            url: "http://www.update.com",
            description: "updated description",
            rating: 5,
          };
          const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...bookmarkToUpdate,
          };
          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .send(bookmarkToUpdate)
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .set("Authorization", "Bearer " + process.env.API_TOKEN)
                .expect(expectedBookmark)
            );
        });

        it("responds with 204 and updates database when given a partial bookmark", () => {
          const idToUpdate = 3;
          const bookmarkToUpdate = {
            title: "updated title",
          };
          const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...bookmarkToUpdate,
          };
          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .send({
              ...bookmarkToUpdate,
              fieldToIgnore: "should not be in GET response",
            })
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .set("Authorization", "Bearer " + process.env.API_TOKEN)
                .expect(expectedBookmark)
            );
        });

        it("removes XSS attack content from response", () => {
          const bookmarkToUpdate = 2;
          const {
            maliciousBookmark,
            expectedBookmark,
          } = makeMaliciousBookmark();
          return supertest(app)
            .patch(`/api/bookmarks/${bookmarkToUpdate}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .send(maliciousBookmark)
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/bookmarks/${bookmarkToUpdate}`)
                .set("Authorization", "Bearer " + process.env.API_TOKEN)
                .expect((res) => {
                  expect(res.body.title).to.eql(expectedBookmark.title);
                  expect(res.body.description).to.eql(
                    expectedBookmark.description
                  );
                })
            );
        });
      });
    });
  });
});
