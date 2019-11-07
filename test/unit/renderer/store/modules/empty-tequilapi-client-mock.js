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
import {
  ConnectionStatus,
  TequilapiClient,
  ServiceInfo,
  ServiceRequest,
  ServiceStatus,
  IdentityPayout,
  AccessPolicy,
  NatStatus,
  parseProposal,
  NatStatusResponse
} from 'mysterium-vpn-js'
import type {
  ConnectionIp,
  ConnectionSession,
  ConnectionStatistics,
  ConnectionStatusResponse,
  ServiceSession,
  Identity,
  ProposalQuery,
  Proposal,
  ConsumerLocation,
  NodeHealthcheck,
  IdentityRegistration
} from 'mysterium-vpn-js'
import { Config } from 'mysterium-vpn-js/lib/config/config'
import { Issue, IssueId } from 'mysterium-vpn-js/lib/feedback/issue'

class EmptyTequilapiClientMock implements TequilapiClient {
  async healthCheck (_timeout: ?number): Promise<NodeHealthcheck> {
    return {
      uptime: '',
      process: 0,
      version: '',
      buildInfo: {
        branch: 'mock branch',
        buildNumber: 'mock build number',
        commit: 'mock commit'
      }
    }
  }

  async stop (): Promise<void> {
  }

  async identityList (): Promise<Array<Identity>> {
    return []
  }

  async identityCurrent (passphrase: string): Promise<Identity> {
    return { id: 'mocked identity' }
  }

  async identityCreate (passphrase: string): Promise<Identity> {
    return { id: 'mocked identity' }
  }

  async identityUnlock (id: string, passphrase: string): Promise<void> {
  }

  async identityRegistration (id: string): Promise<IdentityRegistration> {
    return { registered: true }
  }

  async identityPayout (id: string): Promise<IdentityPayout> {
    return { ethAddress: 'mock eth address', email: '', referralCode: '' }
  }

  async updateIdentityPayout (id: string, ethAddress: string): Promise<void> {
  }

  async updateEmail (id: string, email: string): Promise<void> {
  }

  async updateReferralCode (id: string, referralCode: string): Promise<void> {
  }

  async findProposals (query: ?ProposalQuery): Promise<Array<Proposal>> {
    return []
  }

  async connectionCreate (): Promise<ConnectionStatusResponse> {
    return { status: ConnectionStatus.CONNECTED }
  }

  async connectionStatus (): Promise<ConnectionStatusResponse> {
    return { status: ConnectionStatus.NOT_CONNECTED }
  }

  async connectionCancel (): Promise<void> {
  }

  async connectionIp (): Promise<ConnectionIp> {
    return {}
  }

  async connectionStatistics (): Promise<ConnectionStatistics> {
    return {
      bytesSent: 0,
      bytesReceived: 0,
      duration: 0
    }
  }

  async connectionSessions (): Promise<ConnectionSession[]> {
    return []
  }

  async location (): Promise<ConsumerLocation> {
    return {
      asn: 111
    }
  }

  async serviceList (): Promise<ServiceInfo[]> {
    return []
  }

  async serviceGet (id: string): Promise<ServiceInfo> {
    return buildServiceInfo()
  }

  async serviceStart (request: ServiceRequest, timeout?: number | void): Promise<ServiceInfo> {
    return buildServiceInfo()
  }

  async serviceStop (serviceId: string): Promise<void> {
  }

  async serviceSessions (): Promise<ServiceSession[]> {
    return []
  }

  async accessPolicies (): Promise<AccessPolicy[]> {
    return []
  }

  async natStatus (): Promise<NatStatusResponse> {
    return {
      status: NatStatus.NOT_FINISHED
    }
  }

  async userConfig (): Promise<Config> {
    return {
      data: {}
    }
  }

  async updateUserConfig (config: Config): Promise<void> {
  }

  async authChangePassword (username: string, oldPassword: string, newPassword: string): Promise<void> {
  }

  async authLogin (username: string, password: string): Promise<void> {
  }

  async reportIssue (issue: Issue): Promise<IssueId> {
    return {
      issueId: '1'
    }
  }
}

const buildServiceInfo = (): ServiceInfo => {
  const options: { [key: string]: any } = {}

  return {
    id: '123',
    providerId: '0x123',
    type: 'wireguard',
    proposal: parseProposal({
      id: 1,
      providerId: '0x1',
      serviceType: 'mock',
      serviceDefinition: { locationOriginate: { country: 'lt' } },
      metrics: { connectCount: { success: 0, fail: 10, timeout: 50 } }
    }),
    status: ServiceStatus['NOT_RUNNING'],
    options: options
  }
}

export default EmptyTequilapiClientMock
