<!-- src/bookIndex.vue -->
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
      fetch('/.netlify/functions/books',
        { headers: {'Accept': 'application/json'}})
        .then((response) => response.json())
        .then((result) => {
          this.books = result;
        })
     },
     deleteBook(id) {
       fetch('/.netlify/functions/books/'+id,
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