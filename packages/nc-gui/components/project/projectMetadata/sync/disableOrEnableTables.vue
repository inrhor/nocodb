<template>
  <v-container v-if="dbAliasList[dbsTab]" fluid>
    <v-card>
      <v-row>
        <!--                    <v-col cols="12">-->
        <!--                      <h4 class="text-center my-2 grey&#45;&#45;text text&#45;&#45;darken-2 title"> Metadata Management-->
        <!--                      </h4></v-col>-->
        <v-col cols="8">
          <v-card class="pb-2">
            <v-toolbar flat height="50" class="toolbar-border-bottom">
              <v-text-field
                v-if="dbAliasList && dbAliasList[dbsTab]"
                v-model="filter"
                dense
                hide-details
                class="my-2 mx-auto"
                :placeholder="`Search '${dbAliasList[dbsTab].connection.database}' models`"
                prepend-inner-icon="search"
                style="max-width:500px"
                outlined
              />

              <v-spacer />
              <x-btn
                outlined
                tooltip="Reload list"
                small
                color="primary"
                icon="refresh"
                @click="loadModels();loadTableList()"
              >
                Reload
              </x-btn>
              <x-btn
                outlined
                :loading="updating"
                :disabled="updating || !edited"
                tooltip="Save Changes"
                small
                color="primary"
                icon="save"
                @click="saveModels()"
              >
                Save
              </x-btn>
            </v-toolbar>

            <div class="d-flex d-100 justify-center">
              <v-simple-table dense style="min-width: 400px">
                <thead>
                  <tr>
                    <th>
                      Models <span v-show="!isNewOrDeletedModelFound" class="caption ml-1">({{
                        enableCountText
                      }})</span>
                    </th>
                    <th>APIs</th>
                    <th>Actions</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="model in comparedModelList" :key="model.title">
                    <!--                    v-if="model.alias.toLowerCase().indexOf(filter.toLowerCase()) > -1">-->
                    <td>
                      <v-tooltip bottom>
                        <template #activator="{on}">
                          <span v-on="on">{{ model.alias }}</span>
                        </template>
                        <span class="caption">{{ model.title }}</span>
                      </v-tooltip>
                    </td>
                    <td>
                      <v-checkbox
                        v-model="model.enabled"
                        dense
                        :disabled="model.new || model.deleted"
                        @change="edited = true"
                      />
                    </td>
                    <td>
                      <template v-if="model.new">
                      <!--                  <x-icon small color="success success" tooltip="Add and sync meta information"-->
                      <!--                          @click="addTableMeta([model.title])">mdi-plus-circle-outline-->
                      <!--                  </x-icon>-->
                      </template>
                      <template v-else-if="model.deleted">
                      <!--                  <x-icon small v-else-if="model.deleted" color="error error" tooltip="Delete meta information"-->
                      <!--                          @click="deleteTableMeta([model.title])">mdi-delete-outline-->
                      <!--                  </x-icon>-->
                      </template>
                      <x-icon
                        v-else
                        small
                        color="primary"
                        tooltip="Recreate metadata"
                        @click="recreateTableMeta(model.title)"
                      >
                        mdi-reload
                      </x-icon>
                    </td>

                    <td>
                      <span
                        v-if="model.new"
                        class="caption success--text"
                      >New table found in DB. Yet to be synced.</span>
                      <span v-else-if="model.deleted" class="caption error--text">This table doesn't exist in DB. Yet to be synced.</span>
                    <!--                  <span v-else class="caption grey&#45;&#45;text">Recreate metadata.</span>-->
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
          </v-card>
        </v-col>
        <v-col cols="4" style="padding-top:100px">
          <div class="d-flex">
            <v-spacer />

            <v-tooltip bottom>
              <template #activator="{on}">
                <v-alert
                  v-if="isNewOrDeletedModelFound"
                  dense
                  border="left"
                  colored-border
                  elevation="2"
                  color="warning"
                  type="warning"
                  v-on="on"
                >
                  Tables metadata <br>is out of sync
                </v-alert>
                <v-alert
                  v-else
                  dense
                  outlined
                  type="success"
                  v-on="on"
                >
                  Tables metadata is in sync
                </v-alert>
              </template>
              <template v-if="!isNewOrDeletedModelFound">
                Metadata for API creation & management is in sync with
                '{{ dbAliasList[dbsTab].connection.database }}' Database.
              </template>
              <template v-else>
                Metadata for API creation & management isn't sync with
                '{{ dbAliasList[dbsTab].connection.database }}' Database.
              </template>
            </v-tooltip>
            <v-spacer />
          </div>
          <div v-if="isNewOrDeletedModelFound" class="d-flex justify-center">
            <x-btn
              x-large
              btn.class="mx-auto primary"
              tooltip="Sync metadata"
              @click="syncMetadata"
            >
              <v-icon color="white" class="mr-2 mt-n1">
                mdi-database-sync
              </v-icon>
              Sync Now
            </x-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { isMetaTable } from '@/helpers/xutils'
import XIcon from '@/components/global/xIcon'
import XBtn from '@/components/global/xBtn'

export default {
  name: 'DisableOrEnableTables',
  components: {
    XBtn,
    XIcon
  },
  props: ['nodes', 'db'],
  data: () => ({
    edited: false,
    models: null,
    updating: false,
    dbsTab: 0,
    filter: '',
    tables: null
  }),
  async mounted() {
    await this.loadModels()
    await this.loadTableList()
  },
  methods: {
    async addTableMeta(tables) {
      try {
        await this.$store.dispatch('sqlMgr/ActSqlOp', [{
          dbAlias: this.db.meta.dbAlias,
          env: this.$store.getters['project/GtrEnv']
        }, 'tableMetaCreate', {
          tableNames: tables// this.comparedModelList.filter(t => t.new).map(t=>t.title)
        }])
        setTimeout(async() => {
          await this.loadModels()
          this.$toast.success('Table metadata added successfully').goAway(3000)
        }, 1000)
      } catch (e) {
        this.$toast.error('Some error occurred').goAway(5000)
      }
    },
    async deleteTableMeta(tables) {
      try {
        await this.$store.dispatch('sqlMgr/ActSqlOp', [{
          dbAlias: this.db.meta.dbAlias,
          env: this.$store.getters['project/GtrEnv']
        }, 'tableMetaDelete', {
          tableNames: tables
        }])
        setTimeout(async() => {
          await this.loadModels()
          this.$toast.success('Table metadata deleted successfully').goAway(3000)
        }, 1000)
      } catch (e) {
        this.$toast.error('Some error occurred').goAway(5000)
      }
    },
    async syncMetadata() {
      const addTables = this.comparedModelList.filter(t => t.new).map(t => t.title)
      const deleteTables = this.comparedModelList.filter(t => t.deleted).map(t => t.title)
      if (addTables.length) {
        await this.addTableMeta(addTables)
      }
      if (deleteTables.length) {
        await this.deleteTableMeta(deleteTables)
      }
    },

    async recreateTableMeta(table) {
      try {
        await this.$store.dispatch('sqlMgr/ActSqlOp', [{
          dbAlias: this.db.meta.dbAlias,
          env: this.$store.getters['project/GtrEnv']
        }, 'tableMetaRecreate', {
          tn: table
        }])
        setTimeout(async() => {
          await this.loadModels()
          this.$toast.success('Table metadata recreated successfully').goAway(3000)
        }, 1000)
      } catch (e) {
        this.$toast[e.response?.status === 402 ? 'info' : 'error'](e.message).goAway(3000)
      }
    },
    async loadModels() {
      if (this.dbAliasList[this.dbsTab]) {
        this.models = await this.$store.dispatch('sqlMgr/ActSqlOp', [{
          dbAlias: this.db.meta.dbAlias,
          env: this.$store.getters['project/GtrEnv']
        }, 'xcTableModelsList'])
        this.edited = false
      }
    },
    async loadTableList() {
      this.tables = (await this.$store.dispatch('sqlMgr/ActSqlOp', [{
        dbAlias: this.db.meta.dbAlias,
        env: this.$store.getters['project/GtrEnv']
      }, 'tableList', { force: true, includeM2M: true }])).data.list
    },

    async saveModels() {
      this.updating = true
      try {
        await this.$store.dispatch('sqlMgr/ActSqlOp', [{
          dbAlias: this.db.meta.dbAlias,
          env: this.$store.getters['project/GtrEnv']
        }, 'xcTableModelsEnable', this.models.filter(m => m.enabled).map(m => m.title)])
        this.$toast.success('Models changes are updated successfully').goAway(3000)
      } catch (e) {
        this.$toast[e.response?.status === 402 ? 'info' : 'error'](e.message).goAway(3000)
        console.log(e.message)
      }
      this.updating = false
      this.edited = false
    }
  },
  computed: {
    ...mapGetters({
      dbAliasList: 'project/GtrDbAliasList'
    }),
    enableCountText() {
      return this.models
        ? `${this.models.filter(m => m.enabled).length}/${this.models.length} enabled`
        : ''
    },

    isNewOrDeletedModelFound() {
      return this.comparedModelList.some(m => m.new || m.deleted)
    },
    comparedModelList() {
      const res = []
      const getPriority = (item) => {
        if (item.new) { return 2 }
        if (item.deleted) { return 1 }
        return 0
      }
      if (this.tables && this.models) {
        const tables = this.tables.filter(t => !isMetaTable(t.tn)).map(t => t.tn)
        res.push(...this.models.map((m) => {
          const i = tables.indexOf(m.title)
          if (i === -1) {
            m.deleted = true
          } else {
            tables.splice(i, 1)
          }
          return m
        }))
        res.push(...tables.map(t => ({
          title: t, new: true, alias: t
        })))
      }
      res.sort((a, b) => getPriority(b) - getPriority(a))
      return res
    }
  }
}
</script>

<style scoped lang="scss">
::v-deep {
  .v-tabs-bar {
    border-bottom: solid 1px #7f828b33;
  }

  .v-tab {
    border-right: 1px solid #7f828b33;
  }
}

</style>
<!--
/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Naveen MR <oof1lab@gmail.com>
 * @author Pranav C Balan <pranavxc@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
-->
