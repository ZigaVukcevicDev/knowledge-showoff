<!-- ***** Template ***** -->
<template>
  <tr :class="{ 'no-hover':
    itemsLength === 1 || inMode.edit || inMode.remove }"
  >
    <td>
      <span v-show="!inMode.edit">{{ item.nameFirst }}</span>
      <input
        v-show="inMode.edit"
        ref="nameFirst"
        :value="item.nameFirst"
        type="text"
      />
    </td>
    <td>
      <span v-show="!inMode.edit">{{ item.nameLast }}</span>
      <input
        v-show="inMode.edit"
        ref="nameLast"
        :value="item.nameLast"
        type="text"
      />
    </td>
    <td>
      <a
        v-show="!inMode.edit"
        :title="item.emailAddress"
        :href="`mailto:${item.emailAddress}`"
      >
        {{ item.emailAddress }}
      </a>
      <input
        v-show="inMode.edit"
        ref="emailAddress"
        :value="item.emailAddress"
        type="text"
      />
    </td>
    <td>
      <a
        v-show="!inMode.edit"
        :title="item.phoneNo.regular"
        :href="item.phoneNo | linkPhoneNo"
      >
        {{ item.phoneNo }}
      </a>
      <input
        v-show="inMode.edit"
        ref="phoneNo"
        :value="item.phoneNo"
        type="text"
      />
    </td>
    <td class="text-right">
      <div v-show="!inMode.edit && !inMode.remove" class="flex-row justify-end">
        <button
          v-show="config.itemEdit"
          @click="edit().goIntoMode()"
          class="transparent icon"
        >
          <span class="fa fa-edit"></span>
        </button>
        <button
          v-show="config.itemRemove"
          @click="remove().goIntoMode()"
          class="transparent icon"
        >
          <span class="fa fa-trash"></span>
        </button>
      </div>
      <span v-show="inMode.edit" class="flex-row justify-end">
        <button class="small" @click="edit().save()">Save</button>
        <button class="small" @click="edit().cancel()">Cancel</button>
      </span>
      <span v-show="inMode.remove">
        <button class="small" @click="remove().confirm()">Delete</button>
        <button class="small" @click="remove().cancel()">Cancel</button>
      </span>
    </td>
  </tr>
</template>
<!-- ***** / Template *** -->

<!-- ***** Script ******* -->
<script>
export default {
  name: 'ListItem',
  props: {
    item: Object,
    itemsLength: Number,
    config: Object,
  },
  data() {
    return {
      inMode: {
        edit: false,
        remove: false,
      },
    };
  },
  methods: {
    edit() {
      return {
        goIntoMode: () => {
          this.inMode.edit = true;
        },
        save: () => {
          const { item } = this;
          const refs = this.$refs;

          // Updating values
          item.nameFirst = refs.nameFirst.value;
          item.nameLast = refs.nameLast.value;
          item.emailAddress = refs.emailAddress.value;
          item.phoneNo = refs.phoneNo.value;

          this.inMode.edit = false;
        },
        cancel: () => {
          this.inMode.edit = false;
        },
      };
    },
    remove() {
      return {
        goIntoMode: () => {
          this.inMode.remove = true;
        },
        confirm: () => {
          this.$emit('item-remove');
          this.inMode.remove = false;
        },
        cancel: () => {
          this.inMode.remove = false;
        },
      };
    },
  },
  filters: {
    linkPhoneNo(value) {
      return value ? `tel:${value.match(/[0-9]+/g).join('')}` : null;
    },
  },
};
</script>
<!-- ***** / Script ***** -->

<!-- ***** Style ******** -->
<style scoped lang="scss">
// Table
tr {
  td {
    &:last-child { padding-right: 10px; }
    button.icon { line-height: 32px; }
  }
}
</style>
<!-- ***** / Style ****** -->
