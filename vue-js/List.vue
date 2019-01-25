<!-- ***** Template ***** -->
<template>
  <div>
    <div class="container flex-row wrap justify-between align-center">
      <!-- Search input -->
      <div v-if="config.search" class="form-item search">
        <label for="search">Search</label>
        <input
          type="text"
          id="search"
          v-model="search"
          @keyup="searchItem()"
        />
        <button
          v-show="search"
          @click="searchReset()"
          class="transparent icon no-margin-right"
        >
          <span class="fa fa-close"></span>
        </button>
      </div>
      <!-- / Search input -->
      <button
        v-show="config.itemAdd && !inMode.add"
        @click="itemAdd().goIntoMode()"
        class="no-margin-right js-test-item-add"
      >
        Add item
      </button>
    </div>
    <!-- Add item -->
    <div v-show="inMode.add"
         class="container flex-row wrap justify-start align-center"
    >
      <div class="form-item">
        <label for="nameFirst">{{ headers[0].text }}</label>
        <input type="text" id="nameFirst" ref="nameFirst" />
      </div>
      <div class="form-item">
        <label for="nameLast">Last name</label>
        <input type="text" id="nameLast" ref="nameLast" />
      </div>
      <div class="form-item">
        <label for="emailAddress">Email address</label>
        <input type="text" id="emailAddress" ref="emailAddress" />
      </div>
      <div class="form-item">
        <label for="phoneNo">Phone number</label>
        <input type="text" id="phoneNo" ref="phoneNo" />
      </div>
      <div>
        <button class="small" @click="itemAdd().save()">Save</button>
        <button class="small" @click="itemAdd().cancel()">Cancel</button>
      </div>
    </div>
    <!-- / Add item -->
    <!-- List -->
    <table>
      <!-- Head -->
      <thead>
        <tr>
          <!-- Headers with order option -->
          <th v-for="(header, index) in headers" :key="index">
            <!-- Direction is not set, on click going to asc -->
            <button
              class="transparent"
              v-show="config.order
                      && header.id !== order.key
                      && header.id !== order.direction
                      && itemsMutated.length > 1"
              @click="itemsMutate(header.id, 'asc')"
            >
              {{ header.text }} <span class="fa fa-sort"></span>
            </button>
            <!-- Direction is set to asc, on click set to desc -->
            <button
              class="transparent is-active"
              v-show="config.order
                      && header.id === order.key
                      && order.direction === 'asc'
                      && itemsMutated.length > 1"
              @click="itemsMutate(header.id, 'desc')"
            >
              {{ header.text }} <span class="fa fa-sort-amount-asc"></span>
            </button>
            <!-- Direction is set to desc, on click set to asc -->
            <button
              class="transparent is-active"
              v-show="config.order
                      && header.id === order.key
                      && order.direction === 'desc'
                      && itemsMutated.length > 1"
              @click="itemsMutate(header.id, 'asc')"
            >
              {{ header.text }} <span class="fa fa-sort-amount-desc"></span>
            </button>
            <!-- Config for order set to true or none or only item to show -->
            <span v-show="!config.order || itemsMutated.length <= 1">
              {{ header.text }}
            </span>
          </th>
          <!-- / Headers with order option -->
          <th>Phone number</th>
          <th></th>
        </tr>
      </thead>
      <!-- / Head -->
      <!-- Show body if array of mutated items is empty -->
      <tbody v-show="!itemsMutated.length" class="js-test-list-empty">
        <tr class="no-hover">
          <td colspan="5">
            No items to show.
          </td>
        </tr>
      </tbody>
      <!-- Show body if array of mutated items is not empty -->
      <tbody v-show="itemsMutated.length">
        <ListItem
          v-for="(item, index) in itemsMutated"
          :key="index"
          :item="item"
          :itemsLength="itemsMutated.length"
          :config="{
            itemEdit: config.itemEdit,
            itemRemove: config.itemRemove,
          }"
          v-on:item-remove="itemRemove(index)"
        />
      </tbody>
    </table>
    <!-- / List -->
  </div>
</template>
<!-- ***** / Template *** -->

<!-- ***** Script ******* -->
<script>
import debounce from 'lodash/debounce';
import ListItem from '../components/ListItem.vue';

export default {
  name: 'List',
  components: {
    ListItem,
  },
  props: {
    items: Array,
    config: Object,
  },
  data() {
    return {
      itemsMutated: this.items,
      search: this.search,
      order: {
        key: null,
        direction: null,
      },
      inMode: {
        add: false,
      },
    };
  },
  methods: {
    itemsMutate(key, direction) {
      // Ordering items
      const itemsOrdered = this.itemsOrder(this.items, key, direction);

      // Setting current order for the proper buttons to show or hide
      this.order.key = key;
      this.order.direction = direction;

      // Filtering items
      let itemsFiltered = itemsOrdered;

      // If search is given, filter items
      if (this.search) {
        itemsFiltered = this.itemsFilter(itemsOrdered);
      }

      this.itemsMutated = itemsFiltered;
    },
    itemAdd() {
      return {
        goIntoMode: () => {
          this.inMode.add = true;
        },
        save: () => {
          const refs = this.$refs;

          // Gathering values
          const nameFirst = refs.nameFirst.value;
          const nameLast = refs.nameLast.value;
          const emailAddress = refs.emailAddress.value;
          const phoneNo = refs.phoneNo.value;

          // If at least one input value exists
          if (nameFirst || nameLast || emailAddress || phoneNo) {
            const item = {
              nameFirst, nameLast, emailAddress, phoneNo,
            };

            // Pushing item to list items and mutate list
            this.items.push(item);
            this.itemsMutate(this.order.key, this.order.direction);

            // Emptying inputs
            refs.nameFirst.value = null;
            refs.nameLast.value = null;
            refs.emailAddress.value = null;
            refs.phoneNo.value = null;
          }

          this.inMode.add = false;
        },
        cancel: () => {
          this.inMode.add = false;
        },
      };
    },
    itemRemove(index) {
      this.$delete(this.items, index);
    },
    searchItem: debounce(function () { // eslint-disable-line func-names
      this.itemsMutate(this.order.key, this.order.direction);
    }, 150),
    searchReset() {
      this.search = null;
      this.itemsMutate(this.order.key, this.order.direction);
    },
  },
  created() {
    // Non reactive objects or functions

    // Headers for ordering
    this.headers = [{
      id: 'nameFirst',
      text: 'First name',
    }, {
      id: 'nameLast',
      text: 'Last name',
    }, {
      id: 'emailAddress',
      text: 'Email address',
    }];

    // Function for ordering items
    this.itemsOrder = (items, key, direction) => {
      // Function for comparing values with
      // comparing local special chars as well
      function localCompare(compareKey, compareOrder, a, b) {
        let value;

        if (direction === 'asc') {
          value = (a[key].toLowerCase() < b[key].toLowerCase()) ? -1 : 1;
        } else if (direction === 'desc') {
          value = (a[key].toLowerCase() < b[key].toLowerCase()) ? 1 : -1;
        }

        return value;
      }

      return items.sort(localCompare.bind(null, key, direction));
    };

    // Function for filtering items
    this.itemsFilter = (items) => {
      const itemsFiltered = items.filter((item) => {
        // Check if search string is substring of first name
        // or last name or email address. Convert values
        // to lower case to avoid case sensitive search
        const searchLowerCase = this.search.toLowerCase();

        if (
          item.nameFirst.toLowerCase().includes(searchLowerCase)
          || item.nameLast.toLowerCase().includes(searchLowerCase)
          || item.emailAddress.toLowerCase().includes(searchLowerCase)
        ) {
          // If condition is true, return item
          return item;
        }
        return false;
      });

      return itemsFiltered;
    };

    // Set init order by first name, direction asc
    this.itemsMutate('nameFirst', 'asc');
  },
};
</script>
<!-- ***** / Script ***** -->

<!-- ***** Style ******** -->
<style scoped lang="scss">
// Variables
$container-width: 830px;

// Table
table {
  width: $container-width;
}

// Container
.container {
  max-width: $container-width;
  margin-bottom: 20px;

  .form-item {
    &:nth-child(1) { width: 125px; }
    &:nth-child(2) { width: 120px; }
    &:nth-child(3) { width: 215px; }
    &:nth-child(4) { width: 150px; }
  }
}

// Search
.search {
  width: auto !important;

  button {
    position: absolute;
    top: 22px;
    right: 15px;
    width: 35px;
    min-width: 0;
    line-height: 45px;
    height: 40px;
  }

  input {
    width: 260px;
    padding-right: 30px;
  }
}
</style>
<!-- ***** / Style ****** -->
