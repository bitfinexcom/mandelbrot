'use strict'

// R0
// [id, price, amount]

const BaseOb = require('./base-ob')

class R0Orderbook extends BaseOb {
  constructor (opts = {}) {
    super(opts)

    this.type = 'R0'
  }

  deleteFromKeyed (id, state) {
    const f = (el) => {
      return el.id !== id
    }

    return {
      asks: state.asks.filter(f),
      bids: state.bids.filter(f)
    }
  }

  deleteFromRaw (id, state) {
    const filtered = state.filter((el) => {
      return el[0] !== id
    })

    return filtered
  }

  applyDelete (id, state, keyed) {
    if (keyed) {
      return this.deleteFromKeyed(id, state)
    }

    return this.deleteFromRaw(id, state)
  }

  deleteEntry (id) {
    const { keyed } = this.conf
    this.state = this.applyDelete(id, this.state, keyed)
  }

  applyUpdate (update) {
    const [id, price] = update

    if (price === 0) {
      // when PRICE = 0 then you have to delete the order
      return this.deleteEntry(id)
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

  updateRaw (parsed) {
    const id = parsed[0]

    const idx = this.state.findIndex((el) => {
      return el[0] === id
    })

    if (idx === -1) {
      this.state.push(parsed)
      return
    }

    this.state[idx] = parsed
  }

  updateKeyed (side, parsed) {
    const { id } = parsed
    const bside = this.state[side]

    const idx = bside.findIndex((el) => {
      return id === el.id
    })

    if (idx === -1) {
      bside.push(parsed)
      return
    }

    bside[idx] = parsed
  }

  parseUpdate (el) {
    const { keyed } = this.conf

    const [id, price, amount] = el
    let update = [id, price, amount]

    if (keyed) {
      update = {
        id: update[0],
        price: update[1],
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
      // [id, price, amount]
      const order = {
        id: el[0],
        price: el[1],
        amount: el[2]
      }

      return order
    }

    const ob = {
      asks: bids.map(mp).sort((a, b) => b.price - a.price),
      bids: asks.map(mp).sort((a, b) => a.price - b.price)
    }

    return ob
  }
}

module.exports = R0Orderbook
