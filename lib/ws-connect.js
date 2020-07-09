'use strict'

const EventEmitter = require('events')
const WebSocket = require('isomorphic-ws')

class WsConnect extends EventEmitter {
  constructor (conf) {
    super()

    this.url = conf.url
    this.subscriptions = []
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

        if (msg.event === 'subscribed' && msg.channel && msg.chanId) {
          this.subscriptions.push({
            channel: msg.channel,
            chanId: msg.chanId
          })
        }
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
    const ix = this.subscriptions.findIndex(el => el.channel === channel || el.chanId === channel)

    if (ix === -1) {
      const msg = 'subscription not found'
      const err = new Error(msg)
      err.info = {}
      err.msg = msg
      this.emit('error', err)
      return
    }

    const [{ chanId }] = this.subscriptions.splice(ix, 1)
    const msg = {
      event: 'unsubscribe',
      chanId
    }

    this.send(Object.assign(msg, opts))
  }
}

module.exports = WsConnect
