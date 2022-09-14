\<!-- src/App.vue -->
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
    <router-view
      v-bind:books="books"
			v-bind:authors="authors"
			v-bind:publishers="publishers">
    </router-view>
  </div>
</template>

<script>
export default {
  data() {
    return {
      books: [],
			authors: [],
			publishers: []
    }
  },
	emits: {
		update_books(items) {
			this.books = items;
		},
		update_authors(items) {
			this.authors = items;
		},
		update_publishers(items) {
			this.publishers = items;
		}
	}
}
</script>