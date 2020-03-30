'use strict'

const EventEmitter = require('events')

class MsgHandler extends EventEmitter {
  constructor (opts) {
    super()

    this.conf = opts
    this._channels = {}

    this._managedState = opts.state

    Object.keys(this.conf.transports).forEach((tn) => {
      this.conf.transports[tn].on('message', this.handleMessage.bind(this))
    })

    if (opts.customHandler) {
      this.customHandler = opts.customHandler
    }

    this.handlers = {}
  }

  addCallback (name) {
    const hook = (filter, handler) => {
      let mod = 'default'

      if (filter && filter.symbol) {
        mod = filter.symbol
      }

      const [handlerNamePlain] = this.getHandlerNames(name, mod)
      this.handlers[handlerNamePlain] = handler
    }

    return hook
  }

  getHandlerNames (name, mod = 'def') {
    if (/^on/.test(name)) {
      const plain = name + '#' + mod
      const managed = name + '#' + mod

      return [plain, managed]
    }

    const plain = 'on' + name + '#' + mod
    const managed = 'onManaged' + name + '#' + mod
    return [plain, managed]
  }

  isInfoMsg (msg) {
    return Array.isArray(msg) && (msg[0] === '0' || msg[0] === 0)
  }

  handleMessage (msg) {
    if (this.customHandler && this.customHandler(msg)) {
      return
    }

    if (msg.event) {
      this.handleEventMessage(msg)
      return
    }

    // main channel
    if (this.isInfoMsg(msg)) {
      this.handleInfoMessage(msg)
      return
    }

    if (Array.isArray(msg)) {
      const [chanId, data] = msg

      if (data === 'hb') {
        return
      }

      if (data === 'te' || data === 'tu') {
        this.executeCallbacks('PublicTrades', 'default', { parsed: msg })
        this.executeCallbacks('PublicTrades', chanId, { parsed: msg })
        return
      }

      this.handleOrderbookMessage(chanId, data, msg)
    }
  }

  executeCallbacks (component, mod, data) {
    const [pcb, mcb] = this.getHandlerNames(component, mod)

    if (this.handlers[pcb]) {
      this.handlers[pcb](data.parsed)
    }

    if (this.handlers[mcb] && data.state) {
      this.handlers[mcb](data.state)
    }
  }

  handleOrderbookMessage (chanId, data, msg) {
    // channel == book
    if (!this._channels.book) {
      this._channels.book = {}
    }

    if (!this._channels.book[chanId]) {
      return
    }

    const { symbol } = this._channels.book[chanId]

    const [
      parsed,
      state
    ] = this._managedState.update({ component: 'Orderbook', element: symbol }, data)

    this.executeCallbacks('Orderbook', symbol, { parsed, state })
  }

  handleEventMessage (msg) {
    const { channel, event, chanId } = msg

    if (event === 'subscribed') {
      if (!this._channels[channel]) {
        this._channels[channel] = {}
      }

      this._channels[channel][chanId] = msg
    }

    if (event === 'unsubscribed') {
      if (this._channels[channel] && this._channels[channel][chanId]) {
        delete this._channels[channel][chanId]
      }

      const component = this.getComponentName(channel, chanId)
      this._managedState.resetComponent({ component: component, element: chanId })
    }
  }

  getComponentName (id) {
    switch (id) {
      case 'book':
        return 'Orderbook'

      case 'reports':
        return 'PublicTrades'

      case 'wallets':
      case 'ws':
      case 'wu':
        return 'Wallet'

      case 'os':
      case 'on':
      case 'ou':
      case 'oc':
        return 'Orders'

      case 'tu':
      case 'te':
      case 'trades':
        return 'Trades'

      case 'ps':
      case 'pn':
      case 'pu':
      case 'pc':
        return 'Positions'
    }
  }

  handleOrderState (msg) {
    const name = 'Orders'

    const [
      parsed,
      state
    ] = this._managedState.update({ component: name, element: 'default' }, msg)

    this.executeCallbacks(name, 'default', { parsed, state })

    // additionally filtered by pair
    let element
    if (msg[1] === 'os' && msg[2].length === 0) {
      element = []
    } else if (msg[1] === 'os') {
      element = msg[2][0][3]
    } else {
      element = msg[2][3]
    }

    const [
      parsedFiltered,
      stateFiltered
    ] = this._managedState.update({ component: name, element }, msg)

    this.executeCallbacks(name, element, { parsed: parsedFiltered, state: stateFiltered })
  }

  handleInfoMessage (msg) {
    if (!msg) return

    const [, id] = msg
    const name = this.getComponentName(id)

    if (!name) return

    if (name === 'Trades') {
      this.executeCallbacks('PrivateTrades', 'default', { parsed: msg })
      return
    }

    if (name === 'Orders') {
      this.handleOrderState(msg)
      return
    }

    const [
      parsed,
      state
    ] = this._managedState.update({ component: name, element: 'default' }, msg)

    this.executeCallbacks(name, 'default', { parsed, state })
  }
}

module.exports = MsgHandler
