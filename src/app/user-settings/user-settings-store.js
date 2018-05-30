/*
 * Copyright (C) 2018 The "MysteriumNetwork/mysterion" Authors.
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
import {readFile, writeFile} from 'fs'
import {promisify} from 'util'
import type {UserSettings} from './user-settings'

const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

const defaultSettings: UserSettings = {
  showDisconnectNotifications: true
}

class UserSettingsStore {
  _settings: UserSettings = defaultSettings
  _path: string

  constructor (path: string) {
    this._path = path
  }

  async load (): Promise<void> {
    try {
      this._settings = await loadSettings(this._path)
    } catch (e) {
      if (isFileNotExistError(e)) {
        return
      }
      throw e
    }
  }

  async save (): Promise<void> {
    return saveSettings(this._path, this._settings)
  }

  set (settings: UserSettings) {
    this._settings = settings
  }

  get (): UserSettings {
    return this._settings
  }
}

async function saveSettings (path: string, settings: UserSettings): Promise<void> {
  const settingsString = JSON.stringify(settings)
  await writeFileAsync(path, settingsString)
}

async function loadSettings (path: string): Promise<UserSettings> {
  let data = await readFileAsync(path, {encoding: 'utf8'})
  const parsedSettings = JSON.parse(data)

  if (!validateUserSettings(parsedSettings)) {
    throw new TypeError('UserSettings loading failed. Parsed Object is not of UserSettings type.')
  }

  return parsedSettings
}

function validateUserSettings (settings: Object): boolean {
  return (typeof settings.showDisconnectNotifications === 'boolean')
}

function isFileNotExistError (error: Object): boolean {
  return (error.code && error.code === 'ENOENT')
}

export {UserSettingsStore}