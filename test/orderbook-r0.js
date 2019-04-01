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

  it('supports partial matches and price updates, first item', () => {
    const o = new Orderbook()
    const snap = [
      ['18446744073709539151', 1.020000, 13.352000],
      ['18446744073709539180', 1.010000, 1.000000],
      ['18446744073709539685', 1.000000, 89.000000]
    ]

    o.update(snap)
    assert.deepStrictEqual(snap, o.getState())

    const update = ['18446744073709539151', 1.030000, 13.252000]
    o.update(update)

    const exp = [
      ['18446744073709539151', 1.030000, 13.252000],
      ['18446744073709539180', 1.010000, 1.000000],
      ['18446744073709539685', 1.000000, 89.000000]
    ]

    assert.deepStrictEqual(exp, o.getState())
  })

  it('supports partial matches and price updates, middle item', () => {
    const o = new Orderbook()
    const snap = [
      ['18446744073709539151', 1.020000, 13.352000],
      ['18446744073709539180', 1.010000, 1.000000],
      ['18446744073709539685', 1.000000, 89.000000],
      ['12415', 3.999800, -30.000000],
      ['12227', 8.999900, -0.836200],
      ['9545', 50.000000, -0.010000]
    ]

    o.update(snap)
    assert.deepStrictEqual(snap, o.getState())

    const update = ['18446744073709539180', 1.020000, 1.100000]
    o.update(update)

    const exp = [
      ['18446744073709539151', 1.020000, 13.352000],
      ['18446744073709539180', 1.020000, 1.100000],
      ['18446744073709539685', 1.000000, 89.000000],
      ['12415', 3.999800, -30.000000],
      ['12227', 8.999900, -0.836200],
      ['9545', 50.000000, -0.010000]
    ]

    assert.deepStrictEqual(exp, o.getState())
  })

  it('supports partial matches and price updates, first item, keyed snap', () => {
    const o = new Orderbook({ keyed: true })
    const snap = [
      ['18446744073709539151', 1.020000, 13.352000],
      ['18446744073709539180', 1.010000, 1.000000],
      ['18446744073709539685', 1.000000, 89.000000],
      ['12415', 3.999800, -30.000000],
      ['12227', 8.999900, -0.836200],
      ['9545', 50.000000, -0.010000]
    ]

    o.update(snap)

    assert.deepStrictEqual({
      asks: [
        { id: '9545', price: 50, amount: -0.01 },
        { id: '12227', price: 8.9999, amount: -0.8362 },
        { id: '12415', price: 3.9998, amount: -30 }
      ],
      bids: [
        { id: '18446744073709539685', price: 1, amount: 89 },
        { id: '18446744073709539180', price: 1.01, amount: 1 },
        { id: '18446744073709539151', price: 1.02, amount: 13.352 }
      ]
    }, o.getState())

    const updateBids = ['18446744073709539151', 1.030000, 13.252000]
    o.update(updateBids)

    const updateAsks = ['9545', 51, -0.02]
    o.update(updateAsks)

    assert.deepStrictEqual({
      asks: [
        { id: '9545', price: 51, amount: -0.02 },
        { id: '12227', price: 8.9999, amount: -0.8362 },
        { id: '12415', price: 3.9998, amount: -30 }
      ],
      bids: [
        { id: '18446744073709539685', price: 1, amount: 89 },
        { id: '18446744073709539180', price: 1.01, amount: 1 },
        { id: '18446744073709539151', price: 1.03, amount: 13.252 }
      ]
    }, o.getState())
  })

  it('supports partial matches and price updates, middle item, keyed snap', () => {
    const o = new Orderbook({ keyed: true })
    const snap = [
      ['18446744073709539151', 1.020000, 13.352000],
      ['18446744073709539180', 1.010000, 1.000000],
      ['18446744073709539685', 1.000000, 89.000000],
      ['12415', 3.999800, -30.000000],
      ['12227', 8.999900, -0.836200],
      ['9545', 50.000000, -0.010000]
    ]

    o.update(snap)

    assert.deepStrictEqual({
      asks: [
        { id: '9545', price: 50, amount: -0.01 },
        { id: '12227', price: 8.9999, amount: -0.8362 },
        { id: '12415', price: 3.9998, amount: -30 }
      ],
      bids: [
        { id: '18446744073709539685', price: 1, amount: 89 },
        { id: '18446744073709539180', price: 1.01, amount: 1 },
        { id: '18446744073709539151', price: 1.02, amount: 13.352 }
      ]
    }, o.getState())

    const updateBids = ['18446744073709539180', 1.04, 1.111]
    o.update(updateBids)

    const updateAsks = ['12227', 8.9998, -0.8361]
    o.update(updateAsks)

    assert.deepStrictEqual({
      asks: [
        { id: '9545', price: 50, amount: -0.01 },
        { id: '12227', price: 8.9998, amount: -0.8361 },
        { id: '12415', price: 3.9998, amount: -30 }
      ],
      bids: [
        { id: '18446744073709539685', price: 1, amount: 89 },
        { id: '18446744073709539180', price: 1.04, amount: 1.111 },
        { id: '18446744073709539151', price: 1.02, amount: 13.352 }
      ]
    }, o.getState())
  })
})
