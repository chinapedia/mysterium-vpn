/*
 * Copyright (C) 2019 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import { expect } from 'chai'
import IdentityManager from '../../../src/app/identity-manager'
import EmptyTequilapiClientMock from '../renderer/store/modules/empty-tequilapi-client-mock'
import { IdentityPayout } from 'mysterium-vpn-js'
import { captureAsyncError } from '../../helpers/utils'

class IdentityTequilapiClientMock extends EmptyTequilapiClientMock {
  mockIdentityPayout: IdentityPayout

  async identityPayout (id: string): Promise<IdentityPayout> {
    return this.mockIdentityPayout
  }

  async identityUnlock (id: string, passphrase: string): Promise<void> {
  }
}

describe('IdentityManager', () => {
  let manager: IdentityManager
  let tequilapiClient: IdentityTequilapiClientMock

  beforeEach(() => {
    tequilapiClient = new IdentityTequilapiClientMock()
    tequilapiClient.mockIdentityPayout = { ethAddress: 'mock address', email: '', referralCode: '' }
    manager = new IdentityManager(tequilapiClient)
  })

  describe('.fetchEthAddress', () => {
    it('returns eth address', async () => {
      await manager.unlockIdentity({ id: 'mock id' })
      expect(await manager.fetchEthAddress()).to.eq('mock address')
    })

    it('throws error when fetching without unlocking identity', async () => {
      tequilapiClient.mockIdentityPayout = { ethAddress: 'mock address', email: '', referralCode: '' }
      const err = await captureAsyncError(() => manager.fetchEthAddress())
      if (!(err instanceof Error)) {
        throw new Error('Expected error')
      }
      expect(err.message).to.eql('Cannot fetch eth address without current identity')
    })
  })
})
