'use strict'

class State {
  constructor (conf) {
    this.state = Object.keys(conf.components).reduce((acc, el) => {
      acc[el] = {}

      return acc
    }, {})

    this.Components = conf.components
    this.opts = conf.transform
  }

  update (descr, data) {
    const c = this.getComponent(descr)

    c.update(data)

    return [ c.parse(data), c.getState() ]
  }

  getComponent (descr) {
    const { component, element = 'default' } = descr

    if (!this.state[component]) {
      this.state[component] = {}
    }

    if (!this.state[component][element]) {
      this.state[component][element] = this._createComponent(component, element)
    }

    return this.state[component][element]
  }

  _createComponent (component, element) {
    const Component = this.Components[component]
    const opts = this.opts[component.toLowerCase()]

    return new Component(opts)
  }

  resetComponent (descr) {
    const { component, element = 'default' } = descr

    if (!this.state[component] || !this.state[component][element]) {
      return
    }

    this.state[component][element] = this._createComponent(component, element)
  }
}

module.exports = State
