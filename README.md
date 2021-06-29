# DCA (Dollar-Cost-Averaging) Bot for Binance

This is a bot originally made by Luke Liasi, modified for my own personal needs, that allows you to sit back and relax while it automatically invests in cryptocurrency on the Binance exchange for you. The bot allows you to set up recurring buys for any cryptocurrency supported on the exchange at any interval you want. This is optimesed for fiat (USDT / EUR / GBP) purchases. I added a solution to bypass the minimum transaction amount of 10 USDT / EUR / GBP, so that anyone can setup more frequent buys, without fearing the volatility. This part is enforced by making a buy of your desired amount, plus the minimum required to achieve Binance's threshold of min. 10 USDT / EUR / GBP buy, if the amount is sub 10, and then immediately selling the extra amount. If your desired amount is above Binance's threshold, only your amount is executed.
This comes at the cost of a small extra transaction fee on Binance, which can be found here: https://www.binance.com/en/fee/schedule


![DCA Demo](/demo.png)

## Getting Started
### Create a Binance Account
Sign up to [Binance] if you do not already have an account and complete any verification that may be required. You can use my sign-up referral link here if you wish: https://www.binance.com/en/register?ref=76180602. By using this link you earn a small amount of BTC commission on any trades I make.

### Generate API keys
[Create a new API key on Binance](https://www.binance.com/en/support/faq/360002502072). You should select **Enable Reading** and **Enable Spot & Margin Trading** for the restrictions.

## Set up the project
[Node.js](https://nodejs.org) v13 or higher required.
```
git clone https://github.com/vladcimpianu/dca-bot-scheduler-binance.git
cd dca-bot-scheduler-binance
npm install
```

## Configure the bot
Create a `config.js` file in the root, where you can just copy and adjust the example template:
`cp config.example.js config.js`

Fill out each part of the config.js adding your Binance API keys and setting up your buys.

#### Configuration Options:
| Option             | Description |
| -----------        | ----------- |
| `binance_key`      | Your Binance API Key |
| `binance_secret`   | Your Binance API Secret |
| `sendgrid_secret`  | An optional SendGrid API key for the bot to send you email notifications when buy orders are executed |
| `notifications`    | If using SendGrid notifications this value should be an object structured like so: `notifications: { to: "example@example.com", from: "noreply@example.com" }` |
| `buy`              | Array of objects for each buy you want to set up. |

#### Buy object:
| Parameter                     | Description |
| -----------                   | ----------- |
| `asset`                       | The asset you want to buy | 
| `currency`                    | The currency you want to use to buy the asset. E.g: "USD", "GBP", "EUR" etc. |
| `quoteOrderQty` or `quantity` | Use `quoteOrderQty` for the amount you want to spend/invest or alternatively you can set `quantity` to buy a set amount of the asset regardless of price. Note that [Binance trading rules](https://www.binance.com/en/trade-rule) pairs have minimum order sizes and my solution to this involves always making sure you have enough money in the spot account. This includes the amount needed to comply to Binance's minimum buy amount, which is returned to your spot account after every transaction. Tip: not scheduling multiple buys at the exact same hour lets you reuse the same amount of 'extra' money for every purchase.  |
| `schedule`                    | A cron expression to set when the buy order should execute for this asset. See [Crontab.guru](https://crontab.guru/) for help setting up schedules. You can omit this `schedule` parameter and the buy order will execute immediately |

## Start the bot
Use this command to start the bot: `npm run start`. The program must stay running, and it will execute the buy orders at the defined schedules using cron jobs.

## Deployment
Consider running the bot in the cloud, so you do not need to run the bot constantly on your computer. I personally recommend and use a [Vultr](https://www.vultr.com/) Cloud Compute VPS instance as the cheapest option.
You will want to use [PM2](https://github.com/Unitech/pm2) process manager or similar on the server which keeps the bot running and can restart the bot automatically if the server or program crashes.

Remember the remote server may be in a different timezone to you, run the command `date` to see the servers timezone to configure your cron accordingly. 

## Automating fiat deposits to Binance
For further automation you can deposit funds into your Binance account automatically via bank transfer. Simply initiate a fiat deposit (bank transfer) via the Binance website and note down the bank details you need to pay to. The reference code and other details never change, so you can set up a standing order with your bank to automatically transfer money to Binance on a schedule with these details.

As an exmaple, you could set up a standing order to deposit to Binance the day after you get paid, and then configure the bot to purchase your crypto the following day.

## Donations
If you found this project helpful and would like to support me, you can donate to one of the following crypto addresses:

* **BTC**: 1EQjYftCUz3xrqbH8JEZyRQCXFicFA7o3F
* **ERC20 / BEP20**: 0x33a018b1db8a5a7d6eda062e0daf54c474b64325
* **EGLD**: erd1juqwet8x0eg9q7cagxael4nckgcgtzxzv785gce0uh93y5fksx6se438mh | herotag: @vladcimpianu
* **ADA**: DdzFFzCqrhsjMJq2q3WNy1QRiEj4D6znBNfGazn4zoXgzhe8dzWej1xF6VMsQeK2mQ9CeULC2R5z1NJj52hCdFaaEYAMryPS7MiTJCZh
## Disclaimer
Use the bot at your own risk. I am not liable for how you choose to use this tool.

## License
[MIT License](http://opensource.org/licenses/MIT)

