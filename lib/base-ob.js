'use strict'

class Orderbook {
  constructor (opts = {}) {
    this.conf = opts

    const { keyed } = this.conf
    this.state = keyed ? { asks: [], bids: [] } : []
  }

  parse (d) {
    const copy = JSON.parse(JSON.stringify(d))

    if (this.isSnapshot(copy)) {
      return this.parseSnap(copy)
    }

    return this.parseUpdate(copy)
  }

  update (d) {
    const copy = JSON.parse(JSON.stringify(d))

    if (this.isSnapshot(copy)) {
      this.setSnapshot(copy)
      return
    }

    this.applyUpdate(copy)
  }

  isSnapshot (d) {
    if (!d[0]) {
      // empty snap
      return true
    }

    if (Array.isArray(d[0])) {
      return true
    }
  }

  setSnapshot (snap) {
    this.state = this.parseSnap(snap)
  }

  applyUpdate (update) {
    throw new Error('not implemented')
  }

  parseUpdate (el) {
    throw new Error('not implemented')
  }

  parseSnap (snap) {
    throw new Error('not implemented')
  }

  getState () {
    return this.state
  }

  decimalsTransformer (el, decimals) {
    console.log('deprected, use a bignum library')
    return el / 10 ** decimals
  }
}

module.exports = Orderbook
