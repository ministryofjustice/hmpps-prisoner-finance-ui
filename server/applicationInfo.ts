import fs from 'fs'
import path from 'path'
import config from './config'

const { buildNumber, gitRef, productId, branchName } = config

export type ApplicationInfo = {
  applicationName: string
  buildNumber: string
  gitRef: string
  gitShortHash: string
  productId: string
  branchName: string
}

export default (): ApplicationInfo => {
  let applicationName: string
  try {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString())

    applicationName = packageJson.name
  } catch (e) {
    // Here we have a different path for the package.json when running unit tests
    const packageJsonPath = path.join(__dirname, '../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString())

    applicationName = packageJson.name
  }
  return { applicationName, buildNumber, gitRef, gitShortHash: gitRef.substring(0, 7), productId, branchName }
}
