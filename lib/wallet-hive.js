'use strict'

const Wallet = require('./base-wallet.js')

class WalletHive extends Wallet {
  constructor (conf = {}) {
    super(conf)

    this.state = []

    this.conf = conf
  }

  parse (d) {
    const copy = JSON.parse(JSON.stringify(d))

    if (this.isSnapshot(copy)) {
      return this.parseSnap(copy)
    }

    return this.parseUpdate(copy)
  }

  isSnapshot (u) {
    return true
  }

  parseSnap (snap) {
    const res = Object.keys(snap).map((k) => {
      const el = snap[k]
      const entry = [
        el.wallettype,
        el.currency,
        el.balance,
        el.unsettled_interest,
        null
      ]

      return entry
    })

    return res
  }

  parseUpdate (update) {
    return update
  }

  update (u) {
    const copy = JSON.parse(JSON.stringify(u))

    if (this.isSnapshot(copy)) {
      this.setSnapshot(copy)
      return
    }

    this.applyUpdate(copy)
  }

  setSnapshot (snap) {
    const res = this.parseSnap(snap)

    this.state = res
  }

  applyUpdate (update) {
    throw new Error('not implemented')
  }

  getState () {
    return this.state
  }
}

module.exports = WalletHive
