/*
 * Copyright (C) 2018 The "mysteriumnetwork/mysterium-vpn" Authors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @flow
import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import DIContainer from '../../../../src/app/di/vue-container'
import IdentityMenu from '@/components/identity-menu'
import { createLocalVue, mount } from '@vue/test-utils'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import type { RendererCommunication } from '../../../../src/app/communication/renderer-communication'
import Vuex from 'vuex'
import mainStoreFactory from '@/store/modules/main'
import EmptyTequilapiClientMock from '../store/modules/empty-tequilapi-client-mock'
import identityStoreFactory from '../../../../src/renderer/store/modules/identity'
import types from '../../../../src/renderer/store/types'
import MockEventSender from '../../../helpers/statistics/mock-event-sender'
import FeatureToggle from '../../../../src/app/features/feature-toggle'
import type { Identity } from 'mysterium-vpn-js'
import IdentityManager from '../../../../src/app/identity-manager'
import BugReporterMock from '../../../helpers/bug-reporter-mock'

describe('IdentityMenu', () => {
  let rendererCommunication: RendererCommunication
  let wrapper: IdentityMenu
  let store: Vuex.Store

  function mountEverything (currentIdentity: ?Identity) {
    const vm = createLocalVue()
    vm.use(Vuex)

    const dependencies = new DIContainer(vm)

    const messageBus = new DirectMessageBus()
    rendererCommunication = buildRendererCommunication(messageBus)

    const tequilapi = new EmptyTequilapiClientMock()
    dependencies.constant('rendererCommunication', rendererCommunication)
    dependencies.constant('getPaymentLink', () => {})
    dependencies.constant('featureToggle', new FeatureToggle({ payments: true }))
    dependencies.constant('tequilapiClient', tequilapi)
    dependencies.constant('identityManager', new IdentityManager(tequilapi))
    dependencies.constant('bugReporter', new BugReporterMock())

    const identity = {
      ...identityStoreFactory(),
      state: { current: currentIdentity }
    }
    store = new Vuex.Store({
      modules: {
        main: mainStoreFactory(tequilapi, new MockEventSender()),
        identity: identity
      }
    })

    wrapper = mount(IdentityMenu, {
      localVue: vm,
      store
    })
  }

  describe('HTML rendering when State is not OK', () => {
    beforeEach(() => {
      mountEverything(null)
    })

    it('should still render component', () => {
      expect(wrapper.findAll('.identity-menu')).to.have.lengthOf(1)
    })
  })

  describe('HTML rendering when State is OK', () => {
    beforeEach(() => {
      mountEverything({ id: '0x1' })
    })

    it('renders menu when it is opened', () => {
      expect(wrapper.classes()).not.to.contain('is-open')
      store.commit(types.SHOW_IDENTITY_MENU)
      expect(wrapper.classes()).to.contain('is-open')
    })

    it('renders client ID', () => {
      expect(wrapper.findAll('.flex-line__item')).to.have.lengthOf(5, 'has 5 elements')
      expect(wrapper.findAll('.identity-menu__text')).to.have.lengthOf(1, 'has ID text')
      expect(wrapper.findAll('.copy-button')).to.have.lengthOf(1, 'has Copy Button')
    })
  })
})
