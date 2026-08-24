DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT,
  edition TEXT,
  copyright INTEGER,
  language TEXT,
  pages INTEGER,
  author TEXT,
  author_id INTEGER,
  publisher TEXT,
  publisher_id INTEGER
);

INSERT INTO books (id, title, edition, copyright, language, pages, author, author_id, publisher, publisher_id) VALUES
  ('1', 'Operating System Concepts', '9th', 2012, 'ENGLISH', 976, 'Abraham Silberschatz', 1, 'John Wiley & Sons', 1),
  ('2', 'Database System Concepts', '6th', 2010, 'ENGLISH', 1376, 'Abraham Silberschatz', 1, 'John Wiley & Sons', 1),
  ('3', 'Computer Networks', '5th', 2010, 'ENGLISH', 960, 'Andrew S. Tanenbaum', 2, 'Pearson Education', 2),
  ('4', 'Modern Operating Systems', '4th', 2014, 'ENGLISH', 1136, 'Andrew S. Tanenbaum', 2, 'Pearson Education', 2);
