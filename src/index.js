import { BinanceAPI } from "./services/binance-api.js";
import { config } from "../config.js";
import cron from "node-schedule";
import cronstrue from "cronstrue";
import { SendGridNotification } from "./services/sendgrid-notification.js";
import colors from "colors";
import fetch from "node-fetch";
import querystring from "querystring";
import { calculateBuyQuntity } from "./helpers/calculateAmountToBuy.js";

const {
  binance_key: BINANCE_KEY,
  binance_secret: BINANCE_SECRET,
  binanceApiUrl: API_URL,
  sendgrid_secret,
} = config;
const notification = new SendGridNotification(sendgrid_secret);

/**
 * @param {object} coin
 */
async function placeOrder(coin) {
  const api = new BinanceAPI(BINANCE_KEY, BINANCE_SECRET);
  const { asset, currency, quantity, quoteOrderQty } = coin;
  const pair = asset + currency;

  const priceChangeUrl = `${API_URL}/api/v3/ticker/24hr?${querystring.stringify(
    {
      symbol: pair,
    }
  )}`;
  const { priceChangePercent } = await fetch(priceChangeUrl, {
    method: "GET",
    headers: {
      "X-MBX-APIKEY": config.binance_key,
      "Content-Type": "application/json",
    },
  }).then((response) => response.json());
  console.log(priceChangePercent);

  const buyQuoteOrderQty = calculateBuyQuntity(
    quoteOrderQty,
    priceChangePercent
  );
  const buyResponse = await api.marketBuy(pair, quantity, buyQuoteOrderQty);

  const sellResponse =
    buyResponse.status === "FILLED" && buyQuoteOrderQty < 10.01
      ? await api.marketSell(pair, quantity, 10.01)
      : {};

  const response = {
    ...buyResponse,
    executedQty: buyQuoteOrderQty,
  };

  if (response.orderId) {
    const successText = `Successfully purchased: ${response.executedQty}${currency} worth of ${asset} @ ${response.fills[0].price}.\n`;
    const data = `${JSON.stringify(response)}\n`;

    console.log(colors.green(successText), colors.grey(data));
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

  for (const coin of config.buy) {
    const { schedule, asset, currency, quantity, quoteOrderQty } = coin;

    if (quantity && quoteOrderQty) {
      throw new Error(
        `Error: You can not have both quantity and quoteOrderQty options at the same time.`
      );
    }

    if (quantity) {
      console.log(
        colors.yellow(
          `CRON set up to buy ${quantity} $${asset} with ${currency} ${
            schedule ? cronstrue.toString(schedule) : "immediately."
          }`
        )
      );
    } else {
      console.log(
        colors.yellow(
          `CRON set up to buy circa ${quoteOrderQty} ${currency} of $${asset} ${
            schedule ? cronstrue.toString(schedule) : "immediately."
          }`
        )
      );
    }

    // If a schedule is not defined, the asset will be bought immediately
    // otherwise a cronjob is setup to place the order on a schedule
    if (!schedule) {
      await placeOrder(coin);
    } else {
      cron.scheduleJob(schedule, async () => await placeOrder(coin));
    }
  }
}

await runBot();
