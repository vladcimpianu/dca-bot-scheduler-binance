import { BinanceAPI } from "./services/binance-api.js";
import { config } from "../config.js";
import cron from "node-schedule";
import cronstrue from "cronstrue";
import { SendGridNotification } from "./services/sendgrid-notification.js";
import colors from "colors";
import fetch from "node-fetch";
import querystring from "querystring";
import { calculateBuyQuntity } from "./helpers/calculateAmountToBuy.js";

/** Args options for buy script (npm run buy):
 * 1. Script Asset - mandatory
 * 2. Quantity in USDT - mandatory
 * 3. Side effect type - optional -> default setting is Margin Buy, current alternative is spot
 * @Example npm run buy btc 5 spot -> will buy 5 USDT of BTC in your spot wallet
 * @Example npm run buy eth 12 -> will buy 12 USDT of ETH in your cross margin wallet
 * @Note This can be configurable for is isolated margin wallet or futures
 */

const apiUrl = "https://api.binance.com";
const notification = new SendGridNotification(config.sendgrid_secret);
const DEFAULT_CURRENCY = "USDT";
const SCRIPT_ASSET = process.argv.slice(2, 3).toString().trim().toUpperCase();
const SCRIPT_QTY = Number(process.argv.slice(3, 4));
console.log(SCRIPT_QTY);
const SIDE_EFFECT_TYPE =
  process.argv.slice(4, 5).toString().trim().toLowerCase() === "spot"
    ? "NO_SIDE_EFFECT"
    : "";

async function placeOrder(coin) {
  const api = new BinanceAPI(config.binance_key, config.binance_secret);
  const { asset, currency, quantity, quoteOrderQty } = coin;
  const pair = asset + currency;

  const priceChangeUrl = `${apiUrl}/api/v3/ticker/24hr?${querystring.stringify({
    symbol: pair,
  })}`;
  const { priceChangePercent } = await fetch(priceChangeUrl, {
    method: "GET",
    headers: {
      "X-MBX-APIKEY": config.binance_key,
      "Content-Type": "application/json",
    },
  }).then((response) => response.json());

  console.log(
    colors.bgBlue(
      `Price for ${asset} changed ${priceChangePercent}% in the last 24 hours.`
    )
  );

  const quoteQty = SCRIPT_QTY ? SCRIPT_QTY : quoteOrderQty;

  const buyQuoteOrderQty = calculateBuyQuntity(quoteQty, priceChangePercent);

  const buyResponse = await api.marketBuy(
    pair,
    quantity,
    buyQuoteOrderQty < 10.01 ? buyQuoteOrderQty + 10.01 : buyQuoteOrderQty,
    SIDE_EFFECT_TYPE
  );

  const sellResponse =
    buyResponse.status == "FILLED" && buyQuoteOrderQty < 10.01
      ? await api.marketSell(pair, quantity, 10.01, SIDE_EFFECT_TYPE)
      : {};

  const response = {
    ...buyResponse,
    executedQty: buyQuoteOrderQty,
  };

  if (response.orderId) {
    const successText = `Successfully purchased: ${response.executedQty} ${currency} worth of ${asset} @ ${response.fills[0].price}.\n`;
    const data = `${JSON.stringify(response)}\n`;

    console.log(colors.bgGreen(successText), colors.grey(data));
    await notification.send(
      config.notifications.to,
      config.notifications.from,
      `Buy order executed (${pair})`,
      successText + data
    );
  } else {
    const errorText =
      response.msg || `Unexpected error placing buy order for ${pair}`;
    console.error(colors.red(errorText));
    await notification.send(
      config.notifications.to,
      config.notifications.from,
      `Buy order failed (${pair})`,
      errorText
    );
  }
}

// Loop through all the assets defined to buy in the config and schedule the cron jobs
async function runBot() {
  console.log(
    colors.magenta("Starting DCA Bot on Binance"),
    colors.grey(`[${new Date().toLocaleString()}]`)
  );

  const coin = {
    asset: SCRIPT_ASSET,
    currency: DEFAULT_CURRENCY,
    quoteOrderQty: SCRIPT_QTY,
  };

  if (!coin.quoteOrderQty) {
    throw new Error(`Error: Quote currency quantity has not been provided.`);
  }

  try {
    console.log(
      colors.yellow(
        `CRON started the process to buy circa ${coin.quoteOrderQty} ${coin.currency} of ${coin.asset}.`
      )
    );
  } finally {
    await placeOrder(coin);
  }
}

await runBot();
