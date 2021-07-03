import colors from "colors";

export function calculateBuyQuntity(quoteQty, priceChange) {
  const amountToAdd =
    Number(priceChange) < 0
      ? (((Math.abs(Math.floor(parseFloat(priceChange))) * 10) / 100) *
          quoteQty) /
        2
      : 0;

  const result = quoteQty + amountToAdd;
  console.log(colors.bgMagenta(`Calculated quantity to buy: ${result}`));
  // const result = totalAmount < 10.01 ? totalAmount + 10.01 : totalAmount;
  return result;
}
