import colors from "colors";

export function calculateBuyQuntity(
  quoteQty: number,
  priceChange: number | string
) {
  const amountToAdd =
    Number(priceChange) < 0
      ? (((Math.abs(Math.floor(parseFloat(priceChange as string))) * 10) /
          100) *
          quoteQty) /
        2
      : 0;

  const totalAmount = quoteQty + amountToAdd;
  console.log(colors.bgMagenta(`Calculated quantity to buy: ${totalAmount}`));

  const result = totalAmount < 10.01 ? totalAmount + 10.01 : totalAmount;
  return result;
}
