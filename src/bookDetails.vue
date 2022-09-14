<!-- bookDetails.vue -->
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
export default {
  props: ['create','edit','show'],
  data: function() {
    return {
      title: "Book Data",
      prof: {'title':'','edition':'','copyright':'','language':'','pages':'','author':"",'publisher':''},
    }
  },
  created () {
   const route = useRoute();  
   this.findBook(route.params.id);
  },
  methods: {
    findBook: function(id) {
      var book = app.books.find(
        function(x) { return x.id == id; });
      if (book!=null)
        Object.assign(this.book,book);
    },
    updateBook: function() {
      this.prof['_method'] = 'PUT';
      const route = useRoute(); 
      var id = route.params.id;
      fetch('/server/book/'+id,
        { headers: {'Content-Type':'application/json'},
          method: 'POST',
          body: JSON.stringify(this.book)})
        .then((data) => {
          var index = app.books.findIndex(
             function(x) { return x.id == id; });
          app.books[index] = this.book;
          router.push('/book');
        }
      )
    },
    createBook: function() {
      fetch('/server/book',
        { headers: {'Content-Type':'application/json'},
          method: 'POST',
          body: JSON.stringify(this.book)})
        .then((data) => {
           app.books.push(this.book);
           router.push('/book');
        }
      )
    }
  }
}
</script>