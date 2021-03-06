const { remote: { app } } = require('electron')
const { ipcRenderer } = require('electron-better-ipc')
const logger = require('electron-timber')

const settingsLogger = logger.create({ name: 'Settings' })

settingsLogger.log('Settings is awake')

ipcRenderer.answerMain('select-tab', (param) => {
  try {
    const a = document.querySelector(`a[href$='${param}']`)
    if (a) a.click()
  } catch (e) {
    settingsLogger.error(`Error selecting tab for "${param}"`)
  }
})

const updateEditor = () => ipcRenderer.callMain('update-editor')

const getFieldNames = () => (
  Array
    .from(document.querySelectorAll('section#git-user input.govuk-input'))
    .reduce((accumulator, element) => accumulator.concat(element.getAttribute('name')), [])
)

function setFieldValues (fieldNames, fieldValues) {
  fieldNames
    .forEach((fieldName) => {
      const value = fieldValues[fieldName]

      document.getElementById(fieldName)
        .value = value || ''
    })
}

function getFieldValues (fieldNames) {
  return fieldNames
    .reduce((accumulator, fieldName) => {
      const value = document.getElementById(fieldName)
        .value || ''
      return { ...accumulator, [fieldName]: value }
    }, {})
}

const reduceUserSettings = (userSettings) => (accumulator, fieldName) => Reflect.has(userSettings, fieldName) ? { ...accumulator, [fieldName]: Reflect.get(userSettings, fieldName) } : accumulator

function getUserSettings (fieldNames = []) {
  return fieldNames.reduce(reduceUserSettings(app.store.get('git') || {}), {})
}

function setUserSettings (fieldNames = [], userSettings = {}) {
  app.store.set('git', fieldNames.reduce(reduceUserSettings(userSettings), {}))
}

async function onClickSaveUserSettings () {
  settingsLogger.log('Saving settings ...')

  await app.displayNotification('Saving settings ...', { phase: 'GitHub settings' })

  const fieldNames = getFieldNames()
  const fieldValues = getFieldValues(fieldNames)

  setUserSettings(fieldNames, fieldValues)

  await app.displayNotification('Settings saved', { phase: 'GitHub settings', dismiss: true })

  settingsLogger.log('Settings saved')
}

async function onClickUpdateEditor (event) {
  event.preventDefault()

  await updateEditor()
}

async function onClickGoToGithub () {
  return app.openExternal('https://www.github.com')
}

async function onClickTokenGeneration () {
  return app.openExternal('https://github.com/settings/tokens')
}

{
  const fieldNames = getFieldNames()
  const userSettings = getUserSettings(fieldNames)

  setFieldValues(fieldNames, userSettings)
}

document
  .getElementById('save-user-settings')
  .addEventListener('click', onClickSaveUserSettings)

document
  .querySelector('.govuk-header__navigation-item--active a.govuk-header__link')
  .addEventListener('click', (event) => event.preventDefault())

document
  .getElementById('update-editor')
  .addEventListener('click', onClickUpdateEditor)

document
  .getElementById('github')
  .addEventListener('click', onClickGoToGithub)

document
  .getElementById('generate-token')
  .addEventListener('click', onClickTokenGeneration)
