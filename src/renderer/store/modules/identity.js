/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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
import type from '../types'
import type { Identity, IdentityRegistration } from 'mysterium-vpn-js'
import logger from '../../../app/logger'
import IdentityManager from '../../../app/identity-manager'

type State = {
  current: ?Identity,
  registration: ?IdentityRegistration
}

function stateFactory (): State {
  return {
    current: null,
    registration: null
  }
}

function actionsFactory () {
  return {
    startObserving ({ commit }: { commit: Function }, identityManager: IdentityManager) {
      identityManager.onCurrentIdentityChange((newIdentity: Identity) => {
        commit(type.SET_CURRENT_IDENTITY, newIdentity)
      })
      identityManager.onRegistrationChange((newRegistration: IdentityRegistration) => {
        commit(type.SET_IDENTITY_REGISTRATION, newRegistration)
      })
    }
  }
}

function mutationsFactory () {
  return {
    [type.SET_CURRENT_IDENTITY] (state, identity: Identity) {
      state.current = identity
    },
    [type.SET_IDENTITY_REGISTRATION]: (state: State, registration: IdentityRegistration) => {
      state.registration = registration
    }
  }
}

const getters = {
  currentIdentity (state: State): ?string {
    const identity = state.current
    if (!identity) {
      logger.warn('Trying to get identity which is not present')
      return null
    }
    return identity.id
  },
  registration (state: State): ?IdentityRegistration {
    return state.registration
  }
}

function factory () {
  return {
    state: stateFactory(),
    getters: { ...getters },
    mutations: mutationsFactory(),
    actions: actionsFactory()
  }
}

export type { State }
export default factory
