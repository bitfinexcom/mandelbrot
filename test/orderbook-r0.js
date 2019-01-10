/* eslint-env mocha */

'use strict'

const Orderbook = require('../lib/orderbook-r0.js')
const assert = require('assert')

describe('orderbook helper', () => {
  it('takes snapshots', () => {
    const o = new Orderbook()
    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)

    assert.deepStrictEqual(snap, o.getState())
  })

  it('applies keyed transforms transforms', () => {
    const o = new Orderbook({ keyed: true })
    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)
    const exp = {
      asks: [{
        amount: -12000,
        id: '1',
        price: 5010000
      },
      {
        amount: -12000,
        id: '2',
        price: 5010000
      }],
      bids: [{
        amount: 10000,
        id: '18446744073709551615',
        price: 5000000
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('deletes entries from raw snaps', () => {
    const o = new Orderbook()

    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '18446744073709551614', 10000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ],
      [ '3', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)

    const update = [ '18446744073709551614', 0, 0 ]
    o.applyUpdate(update)

    assert.deepStrictEqual([
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ],
      [ '3', 5010000, -12000 ]
    ], o.getState())
  })

  it('deletes entries from keyed snaps', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '18446744073709551614', 10000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)

    const update = [ '18446744073709551614', 0, 0 ]
    o.applyUpdate(update)

    const exp = {
      asks: [{
        amount: -12000,
        id: '1',
        price: 5010000
      },
      {
        amount: -12000,
        id: '2',
        price: 5010000
      }],
      bids: [{
        amount: 10000,
        id: '18446744073709551615',
        price: 5000000
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('adds entries to raw snaps', () => {
    const o = new Orderbook()

    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '3', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)

    const update = [ '4', 10000, 10000 ]
    o.applyUpdate(update)

    assert.deepStrictEqual([
      [ '18446744073709551615', 5000000, 10000 ],
      [ '3', 5010000, -12000 ],
      [ '4', 10000, 10000 ]
    ], o.getState())
  })

  it('adds entries to keyed snaps, asks', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)

    const update = [ '5', 10000, -10000 ] // sell- ask
    o.applyUpdate(update)

    const exp = {
      asks: [{
        amount: -12000,
        id: '1',
        price: 5010000
      },
      {
        amount: -12000,
        id: '2',
        price: 5010000
      },
      {
        amount: -10000,
        id: '5',
        price: 10000
      }],
      bids: [{
        amount: 10000,
        id: '18446744073709551615',
        price: 5000000
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('adds entries to keyed snaps, bids', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    o.setSnapshot(snap)

    const update = [ '18446744073709551614', 10000, 10001 ] // sell- ask
    o.applyUpdate(update)

    const exp = {
      asks: [{
        amount: -12000,
        id: '1',
        price: 5010000
      },
      {
        amount: -12000,
        id: '2',
        price: 5010000
      }],
      bids: [{
        amount: 10000,
        id: '18446744073709551615',
        price: 5000000
      },
      {
        amount: 10001,
        id: '18446744073709551614',
        price: 10000
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('handles empty order books', () => {
    const o = new Orderbook()

    o.update([]) // [ 'BTC.USD', [] ]

    assert.deepStrictEqual([], o.getState())
  })

  it('detects snapshots and updates', () => {
    const o = new Orderbook()
    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    o.update(snap)

    assert.deepStrictEqual(snap, o.getState())

    const update = [ '4', 10000, 10000 ]
    o.update(update)

    assert.deepStrictEqual([
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ],
      [ '4', 10000, 10000 ]
    ], o.getState())
  })

  it('parses data', () => {
    const o = new Orderbook()
    const snap = [
      [ '18446744073709551615', 5000000, 10000 ],
      [ '1', 5010000, -12000 ],
      [ '2', 5010000, -12000 ]
    ]

    assert.deepStrictEqual(snap, o.parse(snap))

    const update = [ '4', 10000, 10000 ]
    assert.deepStrictEqual(update, o.parse(update))
    o.parse(update)
  })
})
