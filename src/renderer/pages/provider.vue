<!--
  - Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU General Public License
  - along with this program.  If not, see <http://www.gnu.org/licenses/>.
  -->

<template>
  <div class="page">
    <Identity/>

    <tab-navigation-modal
      v-if="showTabModal"
      to="vpn"
      :on-continue="stopAndGoToVpn"
      :on-cancel="() => showTabModal = false"
    >
      Navigating to the VPN page will stop the service.
    </tab-navigation-modal>

    <div class="page__control control">
      <tabs :on-click="onTabClick"/>

      <div class="control__top">
        <h1>{{ statusText }}</h1>
        <div class="ip-category">
          <p class="ip-status">
            IP: <span class="text-blurry">{{ ip }}</span>
            (<span v-text="ipType"/>)
          </p>
        </div>
        <div
          class="nat-status"
          v-if="NatStatus">
          Automatic NAT traversal:
          <span v-html="NatStatusHtml"/>
          <a
            class="nat-link"
            href="#"
            v-if="showNATLink"
            @click.prevent="openNATInstructionsPage">How to configure NAT manually?</a>
        </div>
      </div>

      <div class="control__body traffic-switch">
        <div class="options">
          <div
            class="option"
            :class="{'disabled': !accessPolicy}"
          >
            <input
              id="safe-traffic"
              type="radio"
              :disabled="!accessPolicy || trafficRadioButtonDisabled"
              v-model="accessPolicySelected"
              :value="true">
            <label for="safe-traffic">{{ accessPolicy ? accessPolicy.title : accessPolicyDefaults.title }}</label>
            <div class="explanation">
              {{ accessPolicy ? accessPolicy.description : accessPolicyDefaults.description }}
            </div>
          </div>
          <div class="option">
            <input
              id="all-traffic"
              type="radio"
              :disabled="trafficRadioButtonDisabled"
              v-model="accessPolicySelected"
              :value="false">
            <label for="all-traffic">All traffic</label>
          </div>
        </div>
        <p style="margin-top: -10px; color: #622461; font-weight: bold;">
          Start earning money by running this service.
          <a
            href="#"
            @click.prevent="bountyRegistrationForm">Register to bounty pilot</a>.
        </p>
      </div>

      <div class="control__bottom">
        <div
          class="control__action btn"
          :class="{'btn--transparent': isButtonActive}"
          @click="toggleService">
          {{ buttonText }}
        </div>
      </div>

      <div class="control__footer">
        <div class="footer__stats stats">
          <transition name="slide-up">
            <div
              class="stats__error error"
              v-if="showError">
              <div class="error__text">
                <div>{{ errorMessage }}</div>
              </div>
              <i
                class="error__close close close--s close--white"
                @click="hideErr()"/>
            </div>
          </transition>
          <div class="stats__block">
            <div class="stats__provider">
              <p class="active-connections">
                <span class="connection-count">{{ sessionCount }}</span> active connections
              </p>
              <a
                class="dashboard-link"
                @click="openStatsPage()"
                title="Open dashboard of current service"
              >View dashboard</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import type from '../store/types'
import { mapMutations, mapGetters } from 'vuex'
import AppError from '../partials/app-error'
import Tabs from '../components/tabs'
import { NatStatus, ServiceStatus } from 'mysterium-vpn-js'
import logger from '../../app/logger'
import Identity from '../components/identity'
import AppModal from '../partials/app-modal'
import TabNavigationModal from '../components/tab-navigation-modal'
import { shell } from 'electron'

export default {
  name: 'Main',
  components: {
    TabNavigationModal,
    AppModal,
    Tabs,
    Identity,
    AppError
  },
  dependencies: [
    'bugReporter',
    'providerConfig',
    'providerService',
    'providerSessions',
    'tequilapiClient',
    'rendererCommunication'
  ],
  data () {
    return {
      status: ServiceStatus.NOT_RUNNING,
      pendingStartRequest: false,
      pendingStopRequest: false,
      showTabModal: false,
      sessionCount: 0,
      accessPolicy: null,
      accessPolicySelected: true,
      accessPolicyInterval: null,
      accessPolicyDefaults: {
        title: 'Whitelisted traffic',
        description: 'When you choose to run this traffic you can rest assured that it’s not coming from the dark web.'
      },
      NatStatus: null,
      NatStatusInterval: null
    }
  },
  async mounted () {
    this.startAccessPolicyFetching()
    this.providerService.addStatusSubscriber(this.onStatusChange)
    this.providerService.checkForExistingService().catch(err => {
      logger.error('Check for existing service failed', err)
    })

    this.providerSessions.addCountSubscriber(this.onSessionCountChange)

    // reset any error messages from VPN page
    this.$store.commit(type.HIDE_ERROR)

    // stop statistics fetching
    this.$store.dispatch(type.STOP_ACTION_LOOPING, type.CONNECTION_IP)
    this.$store.dispatch(type.STOP_ACTION_LOOPING, type.FETCH_CONNECTION_STATUS)
  },
  beforeDestroy () {
    this.stopAccessPolicyFetching()
    this.providerService.removeStatusSubscriber(this.onStatusChange)
    this.providerSessions.removeCountSubscriber(this.onSessionCountChange)
  },
  watch: {
    status: function (newStatus, oldStatus) {
      if (newStatus === oldStatus) {
        return
      }

      if (newStatus === ServiceStatus.RUNNING) {
        this.startNatStatusFetching()
        return
      }

      this.stopNatStatusFetching()
    }
  },
  computed: {
    ...mapGetters(['ip', 'location', 'errorMessage', 'showError', 'currentIdentity']),
    ipType () {
      switch (this.location.node_type) {
        case 'residential':
          return 'Residential'
        case 'cellular':
          return 'Cellular'
        default:
          return 'Data center'
      }
    },
    showNATLink () {
      const status = this.NatStatus.status || null

      return status === NatStatus.FAILED || status === NatStatus.NOT_FINISHED
    },
    NatStatusHtml () {
      const status = this.NatStatus.status || null
      switch (status) {
        case NatStatus.SUCCESSFUL:
          return '<span class="text-success">Success</span>'
        case NatStatus.FAILED:
          return '<span class="text-failed">Failed</span>'
        case NatStatus.NOT_FINISHED:
          return '<span class="text-warning">In progress</span>'
      }
    },
    pendingRequests () {
      return this.pendingStartRequest || this.pendingStopRequest
    },
    isButtonActive () {
      return this.status !== ServiceStatus.NOT_RUNNING || this.pendingRequests
    },
    trafficRadioButtonDisabled () {
      if (this.pendingRequests) {
        return true
      }

      switch (this.status) {
        case ServiceStatus.STARTING:
        case ServiceStatus.RUNNING:
          return true
      }

      return false
    },
    statusText () {
      const notRunning = 'Stopped'
      const starting = 'Starting..'
      const running = 'Running'

      switch (this.status) {
        case ServiceStatus.NOT_RUNNING:
          return notRunning
        case ServiceStatus.STARTING:
          return starting
        case ServiceStatus.RUNNING:
          return running
        default:
          const msg = `Unknown status value: ${this.status}`
          logger.error(msg)
          this.bugReporter.captureErrorMessage(msg)
          return notRunning
      }
    },
    buttonText () {
      if (this.pendingStartRequest) {
        return 'Starting..'
      }

      if (this.pendingStopRequest) {
        return 'Stopping..'
      }

      const notRunning = 'Start service'
      const running = 'Stop service'

      switch (this.status) {
        case ServiceStatus.NOT_RUNNING:
          return notRunning
        case ServiceStatus.RUNNING:
          return running
        default:
          const msg = `Unknown status value: ${this.status}`
          logger.error(msg)
          this.bugReporter.captureErrorMessage(msg)
          return notRunning
      }
    }
  },
  methods: {
    ...mapMutations({ hideErr: type.HIDE_ERROR }),
    async toggleService () {
      if (this.pendingRequests) {
        return
      }

      if (this.status === ServiceStatus.NOT_RUNNING) {
        await this.startService()

        return
      }

      if (this.status === ServiceStatus.RUNNING) {
        await this.stopService()
      }

      this.providerService.checkForExistingService()
    },

    async startService () {
      this.pendingStartRequest = true

      try {
        // TODO: before starting service, ensure that VPN service has finished stopping
        await this.providerService.start(
          this.currentIdentity,
          this.providerConfig.serviceType,
          this.accessPolicySelected && this.accessPolicy ? this.accessPolicy.id : null,
          this.providerConfig.options
        )

        this.$store.commit(type.HIDE_ERROR)
      } catch (e) {
        this.$store.commit(type.SHOW_ERROR_MESSAGE, 'Failed to start the service: ' + e.message)
        logger.warn(e)
      }

      this.pendingStartRequest = false
      this.stopAccessPolicyFetching()
    },

    async stopService () {
      this.pendingStopRequest = true

      try {
        await this.providerService.stop()
        this.resetSessions()
      } catch (e) {
        this.$store.commit(type.SHOW_ERROR_MESSAGE, 'Failed to stop the service: ' + e.message)
        logger.warn(e)
      }

      this.pendingStopRequest = false
      this.startAccessPolicyFetching()
    },

    onStatusChange (newStatus) {
      this.status = newStatus
      this.rendererCommunication.providerServiceStatusChanged.send(newStatus)
      // TODO: show error if status changes from "Starting" to "NotRunning"
      // TODO: show error if service ends unexpectedly, without stoping service
    },

    onSessionCountChange (count) {
      this.sessionCount = count
    },

    resetSessions () {
      this.sessionCount = 0
    },

    async stopAndGoToVpn () {
      try {
        await this.providerService.stop()
      } catch (e) {
        const message = 'Failed to stop service during navigation:' + e.message

        this.$store.commit(type.SHOW_ERROR_MESSAGE, message)
        this.bugReporter.captureErrorMessage(message)

        return
      }

      this.goToVpn()
    },

    async onTabClick (page) {
      if (page !== 'vpn') {
        return
      }

      if (this.status !== ServiceStatus.NOT_RUNNING || this.pendingRequests) {
        this.showTabModal = true
        return
      }

      this.goToVpn()
    },

    goToVpn () {
      this.$router.push('/vpn')
    },

    openStatsPage () {
      shell.openExternal(this.getProviderStatsLink(this.currentIdentity, this.providerConfig.serviceType))
    },

    openNATInstructionsPage () {
      const url = 'http://docs.mysterium.network/en/latest/user-guide/installation/' +
        '#router-configuration-for-nodes-behind-nat'
      shell.openExternal(url)
    },

    bountyRegistrationForm () {
      shell.openExternal('https://my.mysterium.network')
    },

    getProviderStatsLink (providerId, serviceType) {
      return this.providerConfig.baseURL + '/node/' + providerId + '/' + serviceType
    },

    startNatStatusFetching () {
      const fetch = async () => {
        try {
          const status = await this.tequilapiClient.NatStatus()

          this.NatStatus = status
        } catch (e) {
          logger.error('Failed fetching NAT status', e)
        }
      }

      fetch()

      this.NatStatusInterval = setInterval(fetch, 3000)
    },

    stopNatStatusFetching () {
      this.NatStatus = null

      clearInterval(this.NatStatusInterval)
    },

    startAccessPolicyFetching () {
      let failedFetchCount = 0
      const allowedFails = 10000

      const fetch = async () => {
        const accessPolicy = await this.providerService.getFirstAccessPolicy()

        if (accessPolicy) {
          failedFetchCount = 0

          this.accessPolicy = accessPolicy
          this.accessPolicyDefaults.title = accessPolicy.title
          this.accessPolicyDefaults.description = accessPolicy.description
          return
        }

        failedFetchCount++

        if (failedFetchCount > allowedFails) {
          this.accessPolicy = null
          this.accessPolicySelected = false
        }
      }

      fetch()

      this.accessPolicyInterval = setInterval(fetch, 3000)
    },

    stopAccessPolicyFetching () {
      clearInterval(this.accessPolicyInterval)
    }
  }
}
</script>

<style lang="less">
  .nat-link {
    display: block;
    color: #622461;
    margin-top: 10px;
    text-decoration: none;
  }

  .nat-status {
    margin-top: 10px;
  }

  .text-success, .text-failed, .text-warning {
    font-weight: bold;
  }

  .text-success {
    color: #06930b;
  }

  .text-warning {
    color: #c7bf00;
  }

  .text-failed {
    color: #932510;
  }
</style>
