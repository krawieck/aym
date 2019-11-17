const vision = require('@google-cloud/vision')
const os = require('os')
const execa = require('execa')
const fs = require('fs').promises
const path = require('path')
const moment = require('moment')

let cred: any
try {
  cred = require('./credentials')
} catch (e) {
  console.error("NO credentials.json FOUND IN DIRECTORY, IT'S PROBABLY NOT GONNA WORK")
}

const isWindows = () => process.platform === 'win32'

async function main() {
  //! MAKE SURE THAT ffmpeg AND ImageMagick ARE INSTALLED
  try {
    await execa('ffmpeg', ['-version'])
  } catch {
    rip('ffmpeg NEEDS TO BE INSTALLED')
  }

  const magick = await (async () => {
    try {
      await execa('convert')
      return 'convert'
    } catch {
      try {
        await execa('magick')
        return 'magick'
      } catch {
        return rip('ImageMagick NEEDS TO BE INSTALLED')
      }
    }
  })()

  //! GET ARGS

  const [, , file, fps_] = process.argv
  const tmpdir = os.tmpdir()
  // console.log({ file, fps: fps_ })
  if (file === undefined) {
    console.error('first argument needs to be a file name')
    return
  }
  if (fps_ === undefined) {
    console.log('WARING: fps not given, assuming default: 1')
  }
  const fps = fps_ || '1'

  //! INITIALIZE GOOGLE VISION

  let client: any
  try {
    client = new vision.ImageAnnotatorClient({
      credentials: cred
    })
  } catch (e) {
    rip(
      e,
      '\n\nGOOGLE CLOUD VISION FAILED TO INITIALIZE\nPROBABLY SOMETHING IS WRONG WITH CREDENTIALS'
    )
  }

  //! CREATE TEMP DIR WHERE IMAGES WILL BE STORED

  const p = path.resolve(tmpdir, '__ayd__', new Date().getTime().toString())
  console.log('Creating temporary directory... ')
  await fs
    .mkdir(p, { recursive: true })
    .catch((e: Error) => rip(e, 'ERROR: COULDNT CREATE TEMP DIRECTORY'))

  //! GENERATE THUMBNAILS

  console.log(`Generating temporary images in ${p}...`)
  await execa('ffmpeg', ['-i', file, '-vf', `fps=${fps}`, path.resolve(p, 'thumb%08d.jpg')]).catch(
    (e: Error) => rip(e, "COULDN'T GENERATE THUMBNAILS")
  )

  //! GATHER THUMBNAILS

  let files: string[] = await fs.readdir(p).catch(rip)

  console.log('Done!')
  console.log()
  console.log('Sending them to susan for family-friendlyness check...\n')

  let checked = []
  files = files.map(f => path.resolve(p, f))

  // console.log({ files })

  //! CHECK FILES USING VISION API

  for (const f of files) {
    process.stdout.write(`\r${checked.length}/${files.length} checked`)
    // console.log({ f })
    checked.push({
      file: f,
      result: await check(f)
    })
  }

  /** Check image using google vision API */
  async function check(fileName: string) {
    // @ts-ignore // cuz nobody made types for vision package :<
    const [result] = await client.safeSearchDetection(fileName)
    return result.safeSearchAnnotation
  }

  fs.writeFile(path.resolve(p, 'results.json'), JSON.stringify(checked))

  console.log('generating fancy images')

  //! GENERATE IMAGES

  const magick_args = (file: string, text: string) => {
    let a = [file, '-background', 'Khaki', `label:'${text}'`, '-gravity', 'Center', '-append', file]
    // console.log({ magick })
    if (magick === 'magick') {
      a.unshift('convert')
    }
    // console.log({ a })
    return a
  }
  for (const c of checked) {
    const {
      // result: { adult, medical, spoof, violence, racy },
      result: { adult, medical, spoof, violence, racy },
      file
    } = c
    await execa(
      magick!,
      magick_args(
        file,
        `Adult: ${adult}, Medical: ${medical},\nSpoof: ${spoof}, Violence: ${violence}, Racy: ${racy}`
      )
    ).catch((e: Error) => rip(e))
  }

  //! OPEN FOLDER

  console.log({
    run: run(),
    p
  })
  const openFolderParams = [p]

  console.log({ iswin: isWindows() })
  // windows being windows :)
  if (isWindows()) {
    openFolderParams.unshift('')
  }

  execa(run(), openFolderParams)
}

main()

function rip(...msg: any) {
  console.error(...msg)
  return process.exit(1)
}

function run() {
  switch (process.platform) {
    case 'darwin':
      return 'open'
    case 'win32':
      return 'start'
    default:
      return 'xdg-open'
  }
}

interface SafeSearchAnnotation {}
