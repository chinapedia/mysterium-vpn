/*
 * Copyright (C) 2017 The "MysteriumNetwork/mysterion" Authors.
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

import {expect} from 'chai'
import NodeHealthcheckDTO from '../../../../../src/libraries/mysterium-tequilapi/dto/node-healthcheck'
import NodeVersionDTO from '../../../../../src/libraries/mysterium-tequilapi/dto/node-version'

describe('TequilapiClient DTO', () => {
  describe('NodeHealthcheckDTO', () => {
    it('sets properties', async () => {
      const status = new NodeHealthcheckDTO({
        uptime: '1h10m',
        process: 1111,
        version: {}
      })

      expect(status.uptime).to.equal('1h10m')
      expect(status.process).to.equal(1111)
      expect(status.version).to.deep.equal(new NodeVersionDTO({}))
    })

    it('sets empty properties', async () => {
      const status = new NodeHealthcheckDTO({})

      expect(status.uptime).to.be.undefined
      expect(status.process).to.be.undefined
      expect(status.version).to.be.undefined
    })

    it('sets wrong properties', async () => {
      const status = new NodeHealthcheckDTO('I am wrong')

      expect(status.uptime).to.be.undefined
      expect(status.process).to.be.undefined
      expect(status.version).to.be.undefined
    })
  })
})