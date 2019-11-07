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
  TequilapiClient,
  ConnectionSession,
  ServiceSession,
  ServiceInfo,
  ServiceRequest,
  IdentityPayout,
  AccessPolicy,
  NatStatusResponse,
  parseProposalList,
  TIMEOUT_DISABLED,
  TEQUILAPI_URL
} from 'mysterium-vpn-js'
import type {
  Identity,
  NodeHealthcheck,
  Proposal,
  ProposalQuery,
  ConnectionRequest,
  ConnectionStatistics,
  ConnectionStatusResponse,
  ConnectionIp,
  ConsumerLocation,
  IdentityRegistration
} from 'mysterium-vpn-js'
import axios from 'axios'
import type { BugReporterMetrics } from './metrics/bug-reporter-metrics'
import { METRICS } from './metrics/metrics'
import { Config } from 'mysterium-vpn-js/lib/config/config'
import { Issue, IssueId } from 'mysterium-vpn-js/lib/feedback/issue'

class TequilapiClientWithMetrics implements TequilapiClient {
  _bugReporterMetrics: BugReporterMetrics
  _client: TequilapiClient

  constructor (client: TequilapiClient, bugReporterMetrics: BugReporterMetrics) {
    this._client = client
    this._bugReporterMetrics = bugReporterMetrics
  }

  async stop (): Promise<void> {
    return this._client.stop()
  }

  async identityList (): Promise<Array<Identity>> {
    return this._client.identityList()
  }

  async identityCurrent (passphrase: string): Promise<Identity> {
    return this._client.identityCurrent(passphrase)
  }

  async identityCreate (passphrase: string): Promise<Identity> {
    return this._client.identityCreate(passphrase)
  }

  async healthCheck (timeout?: number): Promise<NodeHealthcheck> {
    const result = await this._client.healthCheck(timeout)
    this._bugReporterMetrics.setWithCurrentDateTime(METRICS.HEALTH_CHECK_TIME)
    return result
  }

  async identityUnlock (id: string, passphrase: string): Promise<void> {
    this._bugReporterMetrics.set(METRICS.IDENTITY_UNLOCKED, false)
    await this._client.identityUnlock(id, passphrase)
    this._bugReporterMetrics.set(METRICS.IDENTITY_UNLOCKED, true)
  }

  async identityRegistration (id: string): Promise<IdentityRegistration> {
    const result = await this._client.identityRegistration(id)
    this._bugReporterMetrics.set(METRICS.IDENTITY_REGISTERED, result.registered)
    return result
  }

  async identityPayout (id: string): Promise<IdentityPayout> {
    return this._client.identityPayout(id)
  }

  async updateIdentityPayout (id: string, ethAddress: string): Promise<void> {
    return this._client.updateIdentityPayout(id, ethAddress)
  }

  async updateEmail (id: string, email: string): Promise<void> {
    return this._client.updateEmail(id, email)
  }

  async updateReferralCode (id: string, referralCode: string): Promise<void> {
    return this._client.updateReferralCode(id, referralCode)
  }

  async findProposals (query?: ProposalQuery): Promise<Array<Proposal>> {
    const result = await axios.get(`${TEQUILAPI_URL}/proposals`, { params: query })
      .then(res => parseProposalList(res.data))
      .then(data => data.proposals.filter((p: Proposal) => {
        const applicableServiceType = p.serviceType === 'openvpn'
        const withoutWhitelistPolicy = !p.accessPolicies
        return applicableServiceType && withoutWhitelistPolicy
      }))
    if (!result || result.length === 0) {
      this._bugReporterMetrics.set(METRICS.PROPOSALS_FETCHED_ONCE, false)
    } else {
      this._bugReporterMetrics.set(METRICS.PROPOSALS_FETCHED_ONCE, true)
    }
    return result
  }

  async connectionCreate (
    request: ConnectionRequest,
    timeout: number = TIMEOUT_DISABLED): Promise<ConnectionStatusResponse> {
    this._bugReporterMetrics.set(METRICS.CONNECTION_ACTIVE, false)
    const result = await this._client.connectionCreate(request, timeout)
    this._bugReporterMetrics.set(METRICS.CONNECTION_ACTIVE, true)
    return result
  }

  async connectionStatus (): Promise<ConnectionStatusResponse> {
    const result = await this._client.connectionStatus()
    this._bugReporterMetrics.set(METRICS.CONNECTION_STATUS, result)
    return result
  }

  async connectionCancel (): Promise<void> {
    await this._client.connectionCancel()
    this._bugReporterMetrics.set(METRICS.CONNECTION_ACTIVE, false)
  }

  async connectionIp (timeout?: number): Promise<ConnectionIp> {
    const result = await this._client.connectionIp(timeout)
    this._bugReporterMetrics.set(METRICS.CONNECTION_IP, result)
    return result
  }

  async connectionStatistics (): Promise<ConnectionStatistics> {
    const result = await this._client.connectionStatistics()
    this._bugReporterMetrics.set(METRICS.CONNECTION_STATISTICS, result)
    return result
  }

  async location (timeout?: number): Promise<ConsumerLocation> {
    return this._client.location(timeout)
  }

  async connectionSessions (): Promise<ConnectionSession[]> {
    return this._client.connectionSessions()
  }

  async serviceList (): Promise<ServiceInfo[]> {
    return this._client.serviceList()
  }

  async serviceGet (id: string): Promise<ServiceInfo> {
    return this._client.serviceGet(id)
  }

  async serviceStart (request: ServiceRequest, timeout?: number | void): Promise<ServiceInfo> {
    return this._client.serviceStart(request, timeout)
  }

  async serviceStop (serviceId: string): Promise<void> {
    return this._client.serviceStop(serviceId)
  }

  async serviceSessions (): Promise<ServiceSession[]> {
    return this._client.serviceSessions()
  }

  async accessPolicies (): Promise<AccessPolicy[]> {
    return this._client.accessPolicies()
  }

  async natStatus (): Promise<NatStatusResponse> {
    return this._client.natStatus()
  }

  async userConfig (): Promise<Config> {
    return {
      data: {}
    }
  }

  async updateUserConfig (config: Config): Promise<void> {
    return this._client.updateUserConfig(config)
  }

  async authChangePassword (username: string, oldPassword: string, newPassword: string): Promise<void> {
    return this._client.authChangePassword(username, oldPassword, newPassword)
  }

  async authLogin (username: string, password: string): Promise<void> {
    return this._client.authLogin(username, password)
  }

  async reportIssue (issue: Issue): Promise<IssueId> {
    return this._client.reportIssue(issue)
  }
}

export default TequilapiClientWithMetrics
