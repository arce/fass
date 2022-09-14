'use strict';
const express = require('express');
const serverless = require('serverless-http');
const exp = express();
const bodyParser = require('body-parser');
let books = [];

const loadBooks = () => {
  fs.readFile(__dirname + '/' + 'books.json', 'utf8', (err, data) => {
    books = JSON.parse(data)
  });
}
loadBooks();

const app = express.Router();
app.get('/', (req, res) => {
  res.json(books);
});
app.get('/:id', (req, res) => {
  let book = books.find(i => i.id == req.params.id);
  if (book == undefined)
    res.status(404).send('Book not found');
  else
    res.json(book);
});
app.post('/:id', (req, res) => {
  let index = books.findIndex(i => i.id == req.params.id);
  if (index != -1)
    res.status(404).send('Book already exits'); 
  else {
    books.push(body);
  }
});
app.put('/', (req, res) => {
  let index = books.findIndex(i => i.id == req.params.id);
  if (index == -1)
    res.status(404).send('Book not found');
  else {
    books[index] = body;
  }
});
app.delete('/:id', (req, res) => {
  let index = books.findIndex(i => i.id == req.params.id);
  if (index == -1)
    return resolve();
  else {
    books = books.filter(i => i.id != req.params.id);
  }
});
exp.use(bodyParser.json());
exp.use('/.netlify/functions/books', app);
module.exports = exp;
module.exports.handler = serverless(exp);