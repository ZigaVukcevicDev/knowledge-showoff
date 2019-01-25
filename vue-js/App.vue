<!-- ***** Template ***** -->
<template>
  <div id="app">
    <vue-headful
      title="Vue.js tutorials | Course: list component"
      description="Some desc"
    />
    <h1><span>Vue.js tutorials</span><br />Course: list component</h1>

    <h2>List with items</h2>
    <List :items="items" :config="{
      search: true,
      order: true,
      itemAdd: true,
      itemEdit: true,
      itemRemove: true,
    }" />
  </div>
</template>
<!-- ***** / Template *** -->

<!-- ***** Script ******* -->
<script>
import List from './components/List.vue';
import items from './data/items';

export default {
  name: 'app',
  components: {
    List,
  },
  data() {
    return {
      items,
    };
  },
};
</script>
<!-- ***** / Script ***** -->

<!-- ***** Style ******** -->
<style lang="scss">
// Importing icons
@import '../node_modules/line-awesome/css/line-awesome.min.css';

// App
#app {
  font-family: $font-family;
  padding: 20px;
}

// Table
th {
  &:nth-child(1),
  &:nth-child(2) { width: 105px; }
  &:nth-child(3) { width: 215px; }
  &:nth-child(4) { width: 120px; }
}

// Icons
.fa { font-size: 16px !important; }
</style>
<!-- ***** / Style ****** -->
