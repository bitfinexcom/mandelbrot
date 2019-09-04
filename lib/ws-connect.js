'use strict'

const EventEmitter = require('events')
const WebSocket = require('isomorphic-ws')

class WsConnect extends EventEmitter {
  constructor (conf) {
    super()

    this.url = conf.url
  }

  open () {
    const ws = this.ws = new WebSocket(this.url)

    ws.onerror = (err) => {
      this.emit('error', err)
    }

    ws.onopen = () => {
      this.connected = true
      this.emit('open')
    }

    ws.onclose = () => {
      this.connected = false
      this.emit('close')
    }

    ws.onmessage = (m) => {
      let msg

      try {
        msg = JSON.parse(m.data)
      } catch (e) {
        const err = new Error('invalid message, see info and msg prop')
        err.info = e
        err.msg = m.data

        this.emit('error', err)
        return
      }

      this.emit('message', msg)
    }
  }

  close () {
    this.ws.close()
  }

  send (msg) {
    const str = JSON.stringify(msg)
    this.ws.send(str)
  }

  subscribe (channel, opts) {
    const msg = {
      event: 'subscribe',
      channel: channel
    }

    this.send(Object.assign(msg, opts))
  }

  unsubscribe (channel, opts) {
    const msg = {
      event: 'unsubscribe',
      channel: channel
    }

    this.send(Object.assign(msg, opts))
  }
}

module.exports = WsConnect
