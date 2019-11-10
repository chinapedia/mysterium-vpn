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

import { download } from 'electron-dl'
import NodeZip from 'node-zip'
import fs from 'fs'
import path from 'path'

export default async function downloadLogs (window, logDir) {
  const zipPath = path.join(logDir, 'logs.zip')

  let zip = new NodeZip()
  zip.file('stdout.log', fs.readFileSync(path.join(logDir, 'stdout.log')))
  zip.file('stderr.log', fs.readFileSync(path.join(logDir, 'stderr.log')))
  zip.file('mysterium-node.log', fs.readFileSync(path.join(logDir, 'mysterium-node.log')))

  const content = await zip.generate({ base64: false, compression: 'DEFLATE' })
  fs.writeFileSync(zipPath, content, 'binary')

  await download(window, 'file://' + zipPath, {
    saveAs: true,
    filename: 'logs.zip',
    openFolderWhenDone: true
  })
}
