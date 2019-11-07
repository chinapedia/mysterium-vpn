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

import type { Country } from '../../app/countries/country'
import { getCountryLabel } from '../../app/countries/utils'
import { ConnectionStatus, ServiceStatus } from 'mysterium-vpn-js'
import TrayMenu from './menu'
import TrayMenuItem from './menu-item'
import TrayMenuSeparator from './menu-item-separator'
import translations from './translations'
import messages from '../../app/messages'
import type { MainCommunication } from '../../app/communication/main-communication'

function getMenuItems (
  appQuit: Function,
  showWindow: Function,
  toggleDevTools: Function,
  communication: MainCommunication,
  countries: Array<Country>,
  vpnStatus: $Values<typeof ConnectionStatus>,
  providerServiceStatus: $Values<typeof ServiceStatus>
) {
  const disconnect = new TrayMenuItem(
    translations.disconnect,
    () => communication.connectionCancel.send()
  )

  const connectSubmenu = new TrayMenu()

  countries.forEach((country: Country) => {
    let label = getCountryLabel(country)
    if (country.isFavorite) {
      label = '* ' + label
    }
    connectSubmenu.add(label, () => {
      communication.connectionRequest.send({ providerId: country.id, providerCountry: country.code })
    })
  })

  if (countries.length === 0) {
    connectSubmenu.add(messages.countryListIsEmpty).disable()
  }

  const connect = new TrayMenuItem(
    translations.connect,
    null,
    null,
    connectSubmenu
  )

  const items = new TrayMenu()
  const vpnStatusItem = (new TrayMenuItem(translations.vpnStatusDisconnected)).disable()
  items.addItem(vpnStatusItem)
  items.addItem(connect)
  items.addItem(disconnect.hide())
  items.addItem(new TrayMenuSeparator())

  const providerServiceStatusItem = new TrayMenuItem(translations.providerServiceStopped).disable()
  items.addItem(providerServiceStatusItem)
  items.addItem(new TrayMenuSeparator())

  items.add(translations.showWindow, () => showWindow())
  items.add(translations.toggleDeveloperTools, () => toggleDevTools(), 'Alt+Command+I')
  items.addItem(new TrayMenuSeparator())
  items.add(translations.quit, () => appQuit(), 'Command+Q')

  switch (vpnStatus) {
    case ConnectionStatus.CONNECTED:
      connect.hide()
      disconnect.show()
      vpnStatusItem.setLabel(translations.vpnStatusConnected)
      break

    case ConnectionStatus.CONNECTING:
      connect.hide()
      disconnect.hide()
      vpnStatusItem.setLabel(translations.vpnStatusConnecting)
      break

    case ConnectionStatus.DISCONNECTING:
      connect.hide()
      disconnect.hide()
      vpnStatusItem.setLabel(translations.vpnStatusDisconnecting)
      break

    case ConnectionStatus.NOT_CONNECTED:
      connect.show()
      disconnect.hide()
      vpnStatusItem.setLabel(translations.vpnStatusDisconnected)
      break

    default:
      connect.show()
      disconnect.hide()
      vpnStatusItem.setLabel(translations.vpnStatusDisconnected)
      break
  }

  switch (providerServiceStatus) {
    case ServiceStatus.NOT_RUNNING:
      providerServiceStatusItem.setLabel(translations.providerServiceStopped)
      break
    case ServiceStatus.STARTING:
      providerServiceStatusItem.setLabel(translations.providerServiceStarting)
      break
    case ServiceStatus.RUNNING:
      providerServiceStatusItem.setLabel(translations.providerServiceRunning)
      break
  }

  return items.getItems()
}

class TrayMenuBuilder {
  _appQuit: Function
  _showWindow: Function
  _toggleDevTools: Function
  _communication: MainCommunication
  _countries: Array<Country> = []
  _connectionStatus: $Values<typeof ConnectionStatus>
  _providerServiceStatus: $Values<typeof ServiceStatus>

  constructor (appQuit: Function, showWindow: Function, toggleDevTools: Function, communication: MainCommunication) {
    this._appQuit = appQuit
    this._showWindow = showWindow
    this._toggleDevTools = toggleDevTools
    this._communication = communication
  }

  updateCountries (proposals: Array<Country>): this {
    this._countries = proposals
    return this
  }

  updateConnectionStatus (status: $Values<typeof ConnectionStatus>): this {
    this._connectionStatus = status
    return this
  }

  updateProviderServiceStatus (status: $Values<typeof ServiceStatus>): this {
    this._providerServiceStatus = status
    return this
  }

  build (): Array<Object> {
    return getMenuItems(
      this._appQuit,
      this._showWindow,
      this._toggleDevTools,
      this._communication,
      this._countries,
      this._connectionStatus,
      this._providerServiceStatus
    )
  }
}

export default TrayMenuBuilder
