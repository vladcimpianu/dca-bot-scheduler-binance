import fetch from "node-fetch";
import crypto from "crypto";
import querystring from "querystring";

export class BinanceAPI {
  /**
   * @param {string} key
   * @param {string} secret
   */
  constructor(key, secret) {
    this.apiUrl = "https://api.binance.com";
    this.key = key;
    this.secret = secret;
  }

  /**
   * @param {object} params
   */
  createSignature(params) {
    return crypto
      .createHmac("sha256", this.secret)
      .update(querystring.stringify(params))
      .digest("hex");
  }

  /**
   * @param {string} symbol
   * @param {string} quantity
   * @param {string} quoteOrderQty
   */
  async marketBuy(symbol, quantity, quoteOrderQty) {
    let params = {
      symbol: symbol,
      side: "BUY",
      type: "MARKET",
      recvWindow: 30000,
      sideEffectType: "MARGIN_BUY",
      timestamp: Date.now(),
    };

    if (quantity) params.quantity = quantity;
    if (quoteOrderQty) params.quoteOrderQty = quoteOrderQty;

    params.signature = this.createSignature(params);

    const orderUrl = `${
      this.apiUrl
    }/sapi/v1/margin/order?${querystring.stringify(params)}`;

    try {
      const response = await fetch(orderUrl, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.key,
          "Content-Type": "application/json",
        },
      });

      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async marketSell(symbol, quantity, quoteOrderQty) {
    let params = {
      symbol: symbol,
      side: "SELL",
      type: "MARKET",
      recvWindow: 30000,
      sideEffectType: "AUTO_REPAY",
      timestamp: Date.now(),
    };

    if (quantity) params.quantity = quantity;
    if (quoteOrderQty) params.quoteOrderQty = quoteOrderQty;

    params.signature = this.createSignature(params);

    const url = `${this.apiUrl}/sapi/v1/margin/order?${querystring.stringify(
      params
    )}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-MBX-APIKEY": this.key,
          "Content-Type": "application/json",
        },
      });

      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }
}
