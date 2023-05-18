process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let isbn;

beforeEach(async function () {
  let result = await db.query(`
        INSERT INTO
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES (
        '0691161518', 
        'http://a.co/eobPtX2', 
        'Matthew Lane', 
        'english', 
        264,  
        'Princeton University Press', 
        'Power-Up: Unlocking the Hidden Mathematics in Video Games', 
        2017)
        RETURNING isbn`);
  isbn = result.rows[0].isbn;
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});

describe("GET /books", function () {
  test("Gets a list of books", async function () {
    const resp = await request(app).get(`/books`);
    const books = resp.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("amazon_url");
  });
});

describe("GET /books/:isbn", function () {
  test("Gets a single book", async function () {
    const resp = await request(app).get(`/books/${isbn}`);
    expect(resp.body.book).toHaveProperty("isbn");
    expect(resp.body.book.isbn).toBe(isbn);
  });
  test("Responds with 404 if can't find book", async function () {
    const resp = await request(app).get(`/books/999`);
    expect(resp.statusCode).toBe(404);
  });
});

describe("POST /books", function () {
  test("Creates a new book", async function () {
    const resp = await request(app).post(`/books`).send({
      isbn: "3333333333",
      amazon_url: "https://amazon.com",
      author: "Test Author",
      language: "english",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Title",
      year: 2000,
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.body.book).toHaveProperty("isbn");
  });
  test("Prevents creating book without required title", async function () {
    const resp = await request(app).post(`/books`).send({});
    expect(resp.statusCode).toBe(400);
  });
});

describe("PUT /books/:id", function () {
  test("Updates a single book", async function () {
    const resp = await request(app).put(`/books/${isbn}`).send({
      isbn: "0691161518",
      amazon_url: "https://amazon.com",
      author: "Test Author",
      language: "english",
      pages: 100,
      publisher: "Test Publisher",
      title: "Test Title",
      year: 2000,
    });
    expect(resp.body.book).toHaveProperty("isbn");
    expect(resp.body.book.title).toBe("Test Title");
    expect(resp.body.book.isbn).toBe(isbn);
  });
  test("Prevents a bad book update", async function () {
    const resp = await request(app).put(`/books/${isbn}`).send({
      isbn: "0691161518",
      amazon_url: "https://amazon.com",
      author: "Test Author",
      language: "english",
      pages: "100",
      publisher: "Test Publisher",
      title: "Test Title",
      year: 2000,
    });
    expect(resp.statusCode).toBe(400);
  });
  test("Responds with 404 if can't find book", async function () {
    // delete book first
    await request(app).delete(`/books/${isbn}`);
    const resp = await request(app).put(`/books/${isbn}`).send({
      title: "test",
    });
    expect(resp.statusCode).toBe(404);
  });
});
