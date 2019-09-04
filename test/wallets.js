/* eslint-env mocha */

'use strict'

const Wallet = require('../lib/base-wallet.js')
const assert = require('assert')

describe('wallet helper', () => {
  it('takes snapshots', () => {
    const w = new Wallet()
    const snap = [
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 100, 0, 100 ]
    ]
    w.setSnapshot(snap)

    assert.deepStrictEqual(snap, w.getState())
  })

  it('applies updates to snapshots', () => {
    const w = new Wallet()
    const snap = [
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 100, 0, 100 ]
    ]

    w.setSnapshot(snap)

    w.applyUpdate([ 'exchange', 'ETH', 93.994, 0, null ])

    assert.deepStrictEqual([
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 93.994, 0, 93.994 ]
    ], w.getState())
  })

  it('adds new wallet types to snapshots', () => {
    const w = new Wallet()
    const snap = [
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 100, 0, 100 ]
    ]

    w.setSnapshot(snap)
    w.applyUpdate([ 'trade', 'EOS', 99, 0, null ])

    assert.deepStrictEqual([
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 100, 0, 100 ],
      [ 'trade', 'EOS', 99, 0, 99 ]
    ], w.getState())
  })

  it('adds new currencies to snapshots', () => {
    const w = new Wallet()
    const snap = [
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 100, 0, 100 ]
    ]

    w.setSnapshot(snap)
    w.applyUpdate([ 'exchange', 'EOS', 99, 0, null ])

    assert.deepStrictEqual([
      [ 'exchange', 'USD', 98.999, 0, 98.999 ],
      [ 'exchange', 'ETH', 100, 0, 100 ],
      [ 'exchange', 'EOS', 99, 0, 99 ]
    ], w.getState())
  })

  it('parse() calls do not affect internal state', () => {
    const w = new Wallet()
    const snap = ['0', 'ws', [
      [ 'exchange', 'USD', 97, 0, 97 ],
      [ 'exchange', 'ETH', 100, 0, 100 ]
    ]]

    w.update(snap)

    const u = ['0', 'wu', [ 'exchange', 'ETH', 70, 0, null ]]
    w.parse(u)

    assert.deepStrictEqual([
      [ 'exchange', 'USD', 97, 0, 97 ],
      [ 'exchange', 'ETH', 100, 0, 100 ]
    ], w.getState())

    w.update(u)

    assert.deepStrictEqual([
      [ 'exchange', 'USD', 97, 0, 97 ],
      [ 'exchange', 'ETH', 70, 0, 70 ]
    ], w.getState())
  })
})
