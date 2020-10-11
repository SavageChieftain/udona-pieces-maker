import fs from 'fs'
import fg from 'fast-glob'
import path from 'path'
import makeDir from 'make-dir'
import SHA256 from 'crypto-js/sha256'
import WordArray from 'crypto-js/lib-typedarrays'
import convert from 'xml-js'

const base = process.env.PWD

const metaArray = ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.jpeg']

const entries = fg.sync(metaArray, {
  ignore: ['dist/**'],
  dot: false,
})

const getPiecePath = (filePath) => {
  const { 0: basePath, 1: piecePath } = filePath.split('/')
  return { basePath, piecePath }
}

const createDir = async (filePath) => {
  const { piecePath } = getPiecePath(filePath)
  const distPath = path.resolve(base, `dist/${piecePath}`)
  const dirName = await makeDir(distPath)
  return dirName
}

const loadImageFile = async (filePath) => {
  const imageFilePath = path.resolve(base, filePath)
  const buffer = fs.readFileSync(imageFilePath)
  return buffer
}

const arraryBufferToSha256 = (buffer) => {
  const arrayBuffer = WordArray.create(buffer)
  return SHA256(arrayBuffer).toString()
}

const createImage = (filePath, cryptedName, dirName) => {
  const imageFilePath = path.resolve(base, filePath)
  const ext = path.extname(imageFilePath)
  const copyFilePath = path.resolve(dirName, `${cryptedName}${ext}`)
  fs.copyFileSync(imageFilePath, copyFilePath)
}

const loadJsonFile = (filePath) => {
  const { basePath, piecePath } = getPiecePath(filePath)
  const configPath = path.resolve(base, `${basePath}/${piecePath}/data.json`)
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  return data
}

const editJson = (data, cryptedName) => {
  data.character.data.data[0].data['_text'] = cryptedName
  return data
}

const createXml = (data, dirName) => {
  const xml = convert.js2xml(data, { compact: true, spaces: 2 })
  const dataXmlPath = path.resolve(dirName, 'data.xml')
  fs.writeFileSync(dataXmlPath, xml)
}

;(async () => {
  const result = entries.map(async (filePath) => {
    console.log(filePath)
    const dirName = await createDir(filePath)
    const buffer = await loadImageFile(filePath)
    const cryptedName = arraryBufferToSha256(buffer)
    createImage(filePath, cryptedName, dirName)
    const data = loadJsonFile(filePath)
    const newData = editJson(data, cryptedName)
    createXml(newData, dirName)
  })
  await Promise.all(result)
})()
