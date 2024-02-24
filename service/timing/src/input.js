const mod = {}

export const init = ({ fs }) => {
  mod.fs = fs
}

export const readFile = ({ filePath }) => {
  return mod.fs.readFileSync(filePath)
}

