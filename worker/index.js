const BASE = '/api/books';

function json(data, status = 200) {
  return new Response(data === undefined ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function findBook(db, id) {
  return await db.prepare('SELECT * FROM books WHERE id = ?').bind(id).first();
}

async function nextId(db) {
  const row = await db
    .prepare('SELECT MAX(CAST(id AS INTEGER)) AS maxId FROM books')
    .first();
  return String((row && row.maxId ? row.maxId : 0) + 1);
}

async function insertBook(db, id, body) {
  await db
    .prepare(
      `INSERT INTO books
         (id, title, edition, copyright, language, pages, author, author_id, publisher, publisher_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.title ?? '',
      body.edition ?? '',
      body.copyright ?? null,
      body.language ?? '',
      body.pages ?? null,
      body.author ?? '',
      body.author_id ?? null,
      body.publisher ?? '',
      body.publisher_id ?? null
    )
    .run();
}

async function updateBookRow(db, id, body) {
  await db
    .prepare(
      `UPDATE books SET
         title = ?, edition = ?, copyright = ?, language = ?, pages = ?,
         author = ?, author_id = ?, publisher = ?, publisher_id = ?
       WHERE id = ?`
    )
    .bind(
      body.title ?? '',
      body.edition ?? '',
      body.copyright ?? null,
      body.language ?? '',
      body.pages ?? null,
      body.author ?? '',
      body.author_id ?? null,
      body.publisher ?? '',
      body.publisher_id ?? null,
      id
    )
    .run();
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (!pathname.startsWith(BASE)) {
      return env.ASSETS.fetch(request);
    }

    const id = pathname.slice(BASE.length).replace(/^\/+/, '') || null;
    const db = env.DB;

    try {
      if (request.method === 'GET' && !id) {
        const { results } = await db.prepare('SELECT * FROM books').all();
        return json(results);
      }

      if (request.method === 'GET' && id) {
        const book = await findBook(db, id);
        if (!book) return new Response('Book not found', { status: 404 });
        return json(book);
      }

      if (request.method === 'POST' && !id) {
        const body = await request.json();
        const newId = await nextId(db);
        await insertBook(db, newId, body);
        return json({ ...body, id: newId }, 201);
      }

      if (request.method === 'POST' && id) {
        const body = await request.json();

        if (body && body._method === 'DELETE') {
          const existing = await findBook(db, id);
          if (!existing) return new Response('Book not found', { status: 404 });
          await db.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
          return new Response(null, { status: 204 });
        }

        const existing = await findBook(db, id);
        if (!existing) return new Response('Book not found', { status: 404 });
        await updateBookRow(db, id, body);
        return json(await findBook(db, id));
      }

      if (request.method === 'PUT' && id) {
        const existing = await findBook(db, id);
        if (!existing) return new Response('Book not found', { status: 404 });
        const body = await request.json();
        await updateBookRow(db, id, body);
        return json(await findBook(db, id));
      }

      if (request.method === 'DELETE' && id) {
        const existing = await findBook(db, id);
        if (!existing) return new Response('Book not found', { status: 404 });
        await db.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204 });
      }

      return new Response('Not found', { status: 404 });
    } catch (err) {
      return new Response('Server error: ' + err.message, { status: 500 });
    }
  },
};
