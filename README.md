# mandelbrot

Generic adapters for trading, runs in Node.js and in the browser.

Used in [sunbeam](https://github.com/bitfinexcom/sunbeam) and [cheesebox](https://github.com/bitfinexcom/cheesebox).

Supports:

## Wallets

`ws`, `wu` parsing and snapshot handling


## Orderbooks

`R0` and `P1` book handling.

## Reference implementation

[sunbeam](https://github.com/bitfinexcom/sunbeam) is heavily relying on Mandelbrot and has a [nice documentation](https://github.com/bitfinexcom/sunbeam#new-sunbeamopts--sunbeam)

You can find the implemented code, with EOSfinex specific extensions here: https://github.com/bitfinexcom/sunbeam/tree/master/lib

## Example

This example connects to a Websocket server. When a wallet is sent with
`ws` and `wu`, it parsed them, stores the current state and logs the result.


```js
const MB = require('mandelbrot')
const Wallet = MB.BaseWallet

class CustomExchangeAdapter extends MB.WsBase {
  constructor (opts) {
    opts.Wallet = Wallet
    super(opts)
  }
}
const ws = new CustomExchangeAdapter({
  url: 'wss://websocket.example.com'
})

ws.on('message', (m) => {
  console.log(m)
})

ws.on('error', (m) => {
  console.error(m)
})

ws.on('open', (m) => {
  ws.onManagedWalletUpdate({}, (res) => {
    console.log('onManagedWalletUpdate', res)
  })
})

ws.open()
```
