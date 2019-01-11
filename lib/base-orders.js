'use strict'

class Orders {
  constructor (opts = {}) {
    this.conf = opts

    const { keyed } = this.conf
    this.state = keyed ? { asks: [], bids: [] } : []
  }

  isSnapshot (d) {
    const type = d[1]
    return type === 'os'
  }

  parse (d) {
    const copy = JSON.parse(JSON.stringify(d))

    if (this.isSnapshot(copy)) {
      return this.parseSnap(copy[2])
    }

    return this.parseUpdate(copy[2])
  }

  update (d) {
    const copy = JSON.parse(JSON.stringify(d))

    if (this.isSnapshot(copy)) {
      this.setSnapshot(copy[2])
      return
    }

    // delete
    if (copy[1] === 'oc') {
      this.applyDelete(copy[2])
      return
    }

    this.applyUpdate(copy[2])
  }

  setSnapshot (snap) {
    this.state = this.parseSnap(snap)
  }

  applyDelete (update) {
    const { keyed } = this.conf

    if (!keyed) return this.deleteFromRaw(update)

    this.deleteFromKeyed(update)
  }

  parseSnap (snap) {
    const { keyed } = this.conf

    if (!keyed) return snap

    const keyedSnap = snap.map((el) => {
      return this.getKeyedFromArray(el)
    })

    return keyedSnap
  }

  getState () {
    return this.state
  }

  parseUpdate (el) {
    const { keyed } = this.conf

    if (!keyed) return el

    return this.getKeyedFromArray(el)
  }

  applyUpdate (update) {
    const { keyed } = this.conf

    if (!keyed) return this.applyUpdateSnapList(update)

    this.applyUpdateSnapKeyed(update)
  }

  applyUpdateSnapKeyed () {
    throw new Error('not implemented')
  }

  applyUpdateSnapList () {
    throw new Error('not implemented')
  }

  deleteFromKeyed () {
    throw new Error('not implemented')
  }

  deleteFromRaw () {
    throw new Error('not implemented')
  }
}

module.exports = Orders
