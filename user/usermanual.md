# Tutorial 5 - Funciones como servicios

Las funciones como servicios (FaaS) permiten ejecutar pequeñas porciones de código en servidores de aplicaciones sin tener que configurar un ambiente de ejecución. Uno de los servicios más populares para realizar este tipo de procesamiento es AWS Lambda de Amazon. Para utilizar este servicio en Amazon es necesario tener una cuenta que muchas veces requiere algún pago adicional.

Este tutorial usa **Cloudflare Workers** como backend y **Cloudflare D1** como base de datos, por una razón concreta: las funciones de **Netlify** no tienen almacenamiento persistente. Cualquier dato guardado en memoria se pierde cada vez que la función se reinicia, lo cual ocurre con frecuencia en un entorno serverless. D1 es una base de datos SQL que sí persiste entre invocaciones, así que los datos creados, editados o borrados por la aplicación se mantienen.

## Front-end

Se desarrollará un front-end que permita realizar consultas a los datos almacenados en el back-end. Se utilizará un front-end desarrollado mediante VueJS. Para esto es necesario incluir scripts que permitan invocar a los servicios adecuados cuando se ejecuta alguna acción de consulta, modificación o eliminación.

A continuación se muestra el código de una aplicación simple que manipula datos de libros. Esta aplicación utilizará el backend mediante funciones como servicios.

### Archivos de configuración

Los archivos de configuración de VueJS son similares a los que se han estado utilizando en los últimos capítulos. El archivo `package.json` incluye además `wrangler` como dependencia de desarrollo: Cloudflare la necesita para saber qué versión usar al desplegar el Worker, aunque no hace falta instalarla ni ejecutarla desde la terminal.

``` js
{
  "name": "main",
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5050"
  },
  "dependencies": {
    "vue": "^3.5.40",
    "vue-router": "^4.6.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.8",
    "vite": "^8.1.5",
    "wrangler": "^4.125.0"
  }
}
```

El archivo que incluye la configuración de Vite, llamado *vite.config.js*, luce de la siguiente forma:

``` js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

Se debe recordar que para instalar los paquetes necesarios en NodeJS en forma local es necesario ejecutar el siguiente comando:

> npm install

### Archivos de carga inicial

El archivo HTML inicial luce de la siguiente forma:

``` html
<html>
  <head>
    <title>Books App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

El archivo main.js, que reside en el directorio src, utiliza diferentes rutas para identificar cada una de las acciones que ejecutará el usuario. Sin embargo, nótese que se utilizan únicamente dos componentes para realizar todas las tareas: *bookIndex.vue* y *bookDetails.vue*.

``` js
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'

import './css/normalize.css';
import './css/skeleton.css';

import bookIndex from './bookIndex.vue'
import bookDetails from './bookDetails.vue'

const routes = [
  { path: '/book',
    component: bookIndex,
    props: true},
  { path: '/book/show/:id',
    component: bookDetails,
    props: {show: true}},
  { path: '/book/edit/:id',
    component: bookDetails,
    props: {edit: true}},
  { path: '/book/create',
    component: bookDetails,
    props: {create: true}},
  { path: '/book/delete/:id',
    component: bookDetails,
    props: {delete: true}},
  { path: '/',
    component: bookIndex,
    props: true},
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes
})

let app = createApp(App)

app.use(router)

app.mount('#app')
```

En este ejemplo se utiliza el mismo framework CSS, llamado Skeleton, que se utilizó en los tutoriales anteriores. Los archivos que forman parte de dicho framework, normalize.css y skeleton.css, deben residir en el subdirectorio /src/css.

### El componente principal

El componente principal, App.vue, define los elementos generales de la pantalla junto con un pequeño menú con tres botones. En este ejemplo solo el primer botón será utilizado. Es importante recordar que debido a la forma en que trabaja VUEjs, este menú aparecerá en todas las páginas.

``` html
<template>
  <div id="app" class="container">
    <div class="row" style="margin-top: 5%">
      <router-link class="button button-primary"
       style="margin-right: 10px;" to="/book">Books
      </router-link>
      <router-link class="button button-primary"
       style="margin-right: 10px;" to="/author">Authors
      </router-link>
      <router-link class="button button-primary"
       to="/publisher">Publishers
      </router-link>
    </div>
    <router-view>
    </router-view>
  </div>
</template>

<script>
export default {
}
</script>
```

### El índice general

El primer componente que se presenta es el índice general de libros, almacenado en el archivo *bookIndex.vue*. En este caso el arreglo de libros se define como estado local del componente y se obtiene desde el back-end al montarse la vista, desplegándose mediante un ciclo v-for de Vue.js. Cada elemento cuenta con tres botones asociados a los URLs que permiten invocar a las pantallas de creación, detalle, actualización y borrado.

A diferencia del tutorial original, las llamadas `fetch` ya no apuntan a `/.netlify/functions/books` sino a `/api/books`, que es la ruta que resuelve el Worker de Cloudflare.

``` html
<template>
  <div class="row">
   <div style="margin-top: 5%">
     <h2>{{title}}</h2>
     <table><thead>
      <tr><th>Title</th><th>Edition</th><th>Copyright</th>
          <th>Author</th><th>Publisher</th></tr>
      </thead><tbody>
      <tr v-for='book in books'><td>{{book.title}}</td>
      <td>{{book.edition}}</td>
      <td>{{book.copyright}}</td>
      <td>{{book.author}}</td>
      <td>{{book.publisher}}</td>
      <td>
      <router-link class="button"
        :to="'/book/show/'+book.id">Show</router-link>
      <router-link class="button"
        :to="'/book/edit/'+book.id">Edit</router-link>
      <a class="button"
        v-on:click="deleteBook(book.id)">Erase</a>
      </td>
      </tr></tbody>
     </table>
     <router-link class="button button-primary"
       to="/book/create">New</router-link>
   </div>
  </div>
</template>
<script>

export default {
  data() {
    return {
      books: [],
      title: 'BookList'
    }
  },
  methods: {
    allBook() {
      fetch('/api/books',
        { headers: {'Accept': 'application/json'}})
        .then((response) => response.json())
        .then((result) => {
          this.books = result;
        })
     },
     deleteBook(id) {
       fetch('/api/books/'+id,
         { headers: {'Content-Type': 'application/json'},
   	       method: 'POST',
           body: JSON.stringify({'_method':'DELETE'})})
         .then((result) => {
          this.allBook();
          }
        )
     }
  },
  mounted() {
    this.allBook()
  }
}
</script>
```

En el código anterior se pueden observar los métodos *allBook* y *deleteBook* que son los encargados de comunicarse con el servidor Restful. En este caso se utiliza la instrucción fetch de Javascript para hacer dichas invocaciones. Nótese que *deleteBook* envía `{'_method':'DELETE'}` dentro de un `POST` en lugar de usar el verbo HTTP `DELETE` directamente; el Worker descrito más adelante interpreta esa bandera para saber que debe borrar el registro.

### Pantalla de detalle

La pantalla de detalle muestra los datos del libro seleccionado, permite también editar sus datos, o bien crear un nuevo libro. Este componente recibe mediante propiedades (*create*, *edit*, *show*) el modo en que debe operar, y obtiene el *id* del libro seleccionado a partir de los parámetros de la ruta.

``` html
<template>
  <div class="row">
   <div class="eleven column" style="margin-top: 5%">
    <h2>{{title}}</h2>
     <form>
     <div class="row">
      <div class="six columns">
       <label for="titleInput">Title</label>
       <input class="u-full-width" type="text"
         v-model="book.title">
      </div>
      <div class="six columns">
       <label for="editionInput">Edition</label>
       <input class="u-full-width" type="text"
          v-model="book.edition">
      </div>
      <div class="six columns">
       <label for="copyrightInput">Copyright</label>
       <input class="u-full-width" type="text"
          v-model="book.copyright">
      </div>
     </div>
     <div class="row">
      <div class="six columns">
       <label for="emailInput">Author</label>
       <input class="u-full-width" type="email"
          v-model="book.author">
      </div>
      <div class="six columns">
       <label for="phoneInput">Publisher</label>
       <input class="u-full-width" type="tel"
         v-model="book.publisher">
      </div>
      <router-link class="button button-primary"
        to="/book">Back</router-link>
      <a v-if='edit' class="button button-primary" style="float: right"
         v-on:click="updateBook()">Update</a>
      <a v-if='create' class="button button-primary" style="float: right"
         v-on:click="createBook()">Create</a>
     </div>
    </form>
   </div>
  </div>
</template>

<script>

import { useRoute, useRouter } from 'vue-router'

export default {
  props: ['create','edit','show'],
  data: function() {
    return {
      title: "Book Data",
      book: {'title':'','edition':'','copyright':'','language':'','pages':'','author':"",'publisher':''},
    }
  },
  created () {
   const route = useRoute();
   this.findBook(route.params.id);
  },
  methods: {
    findBook: function(id) {
      fetch('/api/books/'+id,
        { headers: {'Accept': 'application/json'}})
        .then((response) => response.json())
        .then((result) => {
          this.book = result;
        })
    },
    updateBook: function() {
      const route = useRoute();
      const router = useRouter();
      var id = route.params.id;
      fetch('/api/books/'+id,
        { headers: {'Content-Type':'application/json'},
          method: 'POST',
          body: JSON.stringify(this.book)})
        .then((data) => {
          router.push('/book');
        }
      )
    },
    createBook: function() {
      const router = useRouter();
      fetch('/api/books',
        { headers: {'Content-Type':'application/json'},
          method: 'POST',
          body: JSON.stringify(this.book)})
        .then((data) => {
           router.push('/book');
        }
      )
    }
  }
}
</script>
```

## El back-end

El back-end es un **Cloudflare Worker** que atiende todas las rutas bajo `/api/books` y guarda los datos en una base de datos **D1**, por lo que la información sobrevive a reinicios y despliegues.

### Configuración del Worker

El archivo `wrangler.jsonc`, en la raíz del proyecto, le indica a **Cloudflare** tres cosas: cuál archivo es el punto de entrada del Worker, que el front-end compilado en `./dist` se sirva como sitio estático salvo las rutas `/api/*` (que debe resolver el Worker), y el *binding* `DB` hacia la base de datos D1.

``` jsonc
{
  "name": "faas-books",
  "compatibility_date": "2026-08-24",
  "main": "./worker/index.js",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "faas-books-db",
      "database_id": "REEMPLAZAR-CON-EL-ID-QUE-MUESTRA-EL-DASHBOARD-DE-D1"
    }
  ]
}
```

El valor de `database_id` se obtiene al crear la base de datos (ver la sección de despliegue) y se pega directamente en este archivo.

### Esquema de la base de datos

El archivo `schema.sql` define la tabla `books` y la carga con los mismos cuatro libros de ejemplo del tutorial original. Este archivo no se ejecuta con un comando de terminal: se pega tal cual en la pestaña "Console" de la base de datos D1 dentro del dashboard de Cloudflare.

``` sql
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
```

### Servicio de datos de libros

El archivo `worker/index.js` atiende las acciones (listar, ver detalle, crear, actualizar, borrar) consultando D1.

``` js
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
```

* [Enlace a aplicación](https://fass-example.netlify.app) *(referencia del ejemplo original en Netlify; con esta versión el equivalente sería la URL `*.workers.dev` que asigna Cloudflare al desplegar)*

## Despliegue

 El proyecto se conecta a un repositorio de GitHub y Cloudflare construye y despliega automáticamente en cada `git push`, de forma similar a como trabaja Netlify.

1. Suba este proyecto a un repositorio de GitHub (o GitLab).
2. En el dashboard de Cloudflare, cree la base de datos: sección **D1** → **Create Database**. Copie el `database_id` que se genera.
3. Pegue ese `database_id` en `wrangler.jsonc` y suba el cambio al repositorio.
4. En la misma base de datos, pestaña **Console**, pegue el contenido de `schema.sql` y ejecútelo para crear la tabla y cargar los libros de ejemplo.
5. En **Workers & Pages** → **Crear** → conecte el repositorio de GitHub. Configure el comando de build como `npm run build`; el comando de deploy queda por defecto (`npx wrangler deploy`), que Cloudflare ejecuta con la versión de Wrangler indicada en `package.json`.
6. A partir de ese momento, cada `git push` reconstruye el front-end y despliega el Worker automáticamente.

## Ejercicios

1. Utilizando los datos del primer proyecto cree archivos JSON que incluyan toda la información utilizada.

2. Programe las funciones (backend) de cada tipo de entidad de forma que listen y administren (agreguen, modifiquen y eliminen) la información de dichas entidades a través de tablas en D1.

3. Utilizando Vue, programe los componentes (frontend) de cada tipo de entidad de forma que listen y administren (agreguen, modifiquen y eliminen) la información de dichas entidades. Recuerde incorporar las respectivas opciones en el enrutador de Vue.

4. Publique su aplicación conectando el repositorio a Cloudflare Workers como se describió en la sección de Despliegue. Recuerde que únicamente el backend necesita el binding a D1; el frontend se sirve desde el mismo Worker gracias a la configuración de `assets` en `wrangler.jsonc`.
