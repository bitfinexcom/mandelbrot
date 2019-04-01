'use strict'

// P0
// PRICE, COUNT, AMOUNT

const BaseOb = require('./base-ob')

class P0Orderbook extends BaseOb {
  constructor (opts = {}) {
    super(opts)

    this.type = 'P0'
  }

  setSnapshot (snap) {
    this.state = this.parseSnap(snap)
  }

  applyUpdate (update) {
    const [, count] = update

    if (count === 0) {
      // when COUNT = 0 then you have to delete the order
      return this.deleteEntry(update)
    }

    const parsed = this.parseUpdate(update)
    const { keyed } = this.conf

    if (!keyed) {
      this.updateRaw(parsed)
      return
    }

    const side = this.getSide(update)
    this.updateKeyed(side, parsed)
  }

  updateKeyed (side, parsed) {
    const { price } = parsed
    const bside = this.state[side]

    const idx = bside.findIndex((el) => {
      return price === el.price
    })

    // new
    if (idx === -1) {
      bside.push(parsed)
      return
    }

    bside[idx] = parsed
  }

  updateRaw (parsed) {
    const [price, , amount] = parsed

    const hasSign = amount[0] === '-'
    const idx = this.state.findIndex((el) => {
      if (el[0] !== price) return false

      // bid/ask
      if (hasSign && el[2][0] === '-') {
        return true
      }
    })

    // new
    if (idx === -1) {
      this.state.push(parsed)
      return
    }

    this.state[idx] = parsed
  }

  deleteEntry (update) {
    const { keyed } = this.conf
    this.state = this.applyDelete(update, this.state, keyed)
  }

  deleteFromKeyed (update, state) {
    const [price, , amount] = update

    const side = this.getSide(update)

    state[side] = state[side].filter((el) => {
      return el.price !== price && el.amount !== amount
    })

    return state
  }

  deleteFromRaw (update, state) {
    const filtered = state.filter((el) => {
      return el[0] !== update[0] && el[2] !== update[2]
    })

    return filtered
  }

  applyDelete (update, state, keyed) {
    if (keyed) {
      return this.deleteFromKeyed(update, state)
    }

    return this.deleteFromRaw(update, state)
  }

  parseUpdate (el) {
    const { keyed } = this.conf

    const [price, count, amount] = el
    let update = [price, count, amount]

    if (keyed) {
      update = {
        price: update[0],
        count: update[1],
        amount: update[2]
      }
    }

    return update
  }

  parseSnap (snap) {
    const { keyed } = this.conf

    if (!keyed) {
      return snap
    }

    const keyedSnap = this.getKeyedSnap(snap)
    return keyedSnap
  }

  getKeyedSnap (snap) {
    const asks = snap.filter(el => el[2] > 0)
    const bids = snap.filter(el => el[2] < 0)

    const mp = (el) => {
      const order = {
        price: el[0],
        count: el[1],
        amount: el[2]
      }

      return order
    }

    const ob = {
      asks: bids.map(mp).sort((a, b) => a.price - b.price),
      bids: asks.map(mp).sort((a, b) => b.price - a.price)
    }

    return ob
  }
}

module.exports = P0Orderbook
