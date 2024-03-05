const mod = {}

export const init = ({ fs }) => {
  mod.fs = fs
}

export const makeDir = ({ path }) => {
  if(mod.fs.existsSync(path)) {
    return
  }
  mod.fs.mkdirSync(path, { reqursive: true })
}

