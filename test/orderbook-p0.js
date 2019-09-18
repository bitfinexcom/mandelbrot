/* eslint-env mocha */

'use strict'

const Orderbook = require('../lib/orderbook-p0.js')
const assert = require('assert')

describe('orderbook helper', () => {
  it('takes snapshots', () => {
    const o = new Orderbook()
    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    assert.deepStrictEqual(snap, o.getState())
  })

  it('applies keyed transforms transforms', () => {
    const o = new Orderbook({ keyed: true })
    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)
    const exp = {
      bids: [{
        price: '2.3',
        count: 1,
        amount: '0.3'
      }, {
        price: '1.0',
        count: 2,
        amount: '2.0'
      }],
      asks: [{
        price: '2.2',
        count: 1,
        amount: '-1.0'
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('deletes entries from raw snaps', () => {
    const o = new Orderbook()

    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    const update = ['2.3', 0, '0.3']
    o.applyUpdate(update)

    assert.deepStrictEqual([
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0']
    ], o.getState())
  })

  it('deletes entries from keyed snaps', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    const update = ['2.3', 0, '0.3']
    o.applyUpdate(update)

    const exp = {
      bids: [{
        price: '1.0',
        count: 2,
        amount: '2.0'
      }],
      asks: [{
        price: '2.2',
        count: 1,
        amount: '-1.0'
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('adds entries to raw snaps', () => {
    const o = new Orderbook()

    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    const update = ['3.2', 1, '-1.0']
    o.applyUpdate(update)

    const update2 = ['3.2', 1, '1.0']
    o.applyUpdate(update2)

    assert.deepStrictEqual([
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3'],
      ['3.2', 1, '-1.0'],
      ['3.2', 1, '1.0']
    ], o.getState())
  })

  it('adds entries to keyed snaps, asks', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    const update = ['5.0', 1, '-1.3'] // sell- ask
    o.applyUpdate(update)

    const exp = {
      bids: [{
        price: '2.3',
        count: 1,
        amount: '0.3'
      }, {
        price: '1.0',
        count: 2,
        amount: '2.0'
      }],
      asks: [{
        price: '2.2',
        count: 1,
        amount: '-1.0'
      },
      {
        price: '5.0',
        count: 1,
        amount: '-1.3'
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('adds entries to keyed snaps, bids', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    const update = ['5.3', 1, '44.3']
    o.applyUpdate(update)

    const exp = {
      bids: [{
        price: '2.3',
        count: 1,
        amount: '0.3'
      }, {
        price: '1.0',
        count: 2,
        amount: '2.0'
      }, {
        price: '5.3',
        count: 1,
        amount: '44.3'
      }],
      asks: [{
        price: '2.2',
        count: 1,
        amount: '-1.0'
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })

  it('handles empty order books', () => {
    const o = new Orderbook()

    o.update([]) // [ 'BTC.USD', [] ]

    assert.deepStrictEqual([], o.getState())
  })

  it('updates entries - raw', () => {
    const o = new Orderbook()
    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.update(snap)

    assert.deepStrictEqual(snap, o.getState())

    const update = ['2.2', 2, '-1.0']
    o.update(update)

    assert.deepStrictEqual([
      ['1.0', 2, '2.0'],
      ['2.2', 2, '-1.0'],
      ['2.3', 1, '0.3']
    ], o.getState())

    const update2 = ['2.2', 2, '-2.0']
    o.update(update2)

    assert.deepStrictEqual([
      ['1.0', 2, '2.0'],
      ['2.2', 2, '-2.0'],
      ['2.3', 1, '0.3']
    ], o.getState())
  })

  it('updates entries in keyed snaps', () => {
    const o = new Orderbook({ keyed: true })

    const snap = [
      ['1.0', 2, '2.0'],
      ['2.2', 1, '-1.0'],
      ['2.3', 1, '0.3']
    ]

    o.setSnapshot(snap)

    o.applyUpdate(['2.3', 1, '0.3'])
    o.applyUpdate(['1.0', 1, '2.1'])

    const exp = {
      bids: [{
        price: '2.3',
        count: 1,
        amount: '0.3'
      }, {
        price: '1.0',
        count: 1,
        amount: '2.1'
      }],
      asks: [{
        price: '2.2',
        count: 1,
        amount: '-1.0'
      }]
    }

    assert.deepStrictEqual(exp, o.getState())
  })
})
