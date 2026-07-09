import { normalizeDecimalRate, parseUpbitTradePriceFromJson } from './upbit-rate-parse.ts';

Deno.test('parseUpbitTradePriceFromJson — integer JSON number', () => {
  const rate = parseUpbitTradePriceFromJson('[{"trade_price":1350}]');
  if (rate !== '1350.000000') throw new Error(`expected 1350.000000 got ${rate}`);
});

Deno.test('parseUpbitTradePriceFromJson — decimal JSON number', () => {
  const rate = parseUpbitTradePriceFromJson('[{"trade_price":1350.25}]');
  if (rate !== '1350.250000') throw new Error(`expected 1350.250000 got ${rate}`);
});

Deno.test('parseUpbitTradePriceFromJson — string provider shape', () => {
  const rate = parseUpbitTradePriceFromJson('[{"trade_price":"1401.5"}]');
  if (rate !== '1401.500000') throw new Error(`expected 1401.500000 got ${rate}`);
});

Deno.test('parseUpbitTradePriceFromJson — rejects zero', () => {
  let threw = false;
  try {
    parseUpbitTradePriceFromJson('[{"trade_price":0}]');
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('zero must throw');
});

Deno.test('parseUpbitTradePriceFromJson — rejects negative', () => {
  let threw = false;
  try {
    parseUpbitTradePriceFromJson('[{"trade_price":-1}]');
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('negative must throw');
});

Deno.test('parseUpbitTradePriceFromJson — rejects missing field', () => {
  let threw = false;
  try {
    parseUpbitTradePriceFromJson('[{}]');
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('missing field must throw');
});

Deno.test('parseUpbitTradePriceFromJson — rejects empty array', () => {
  let threw = false;
  try {
    parseUpbitTradePriceFromJson('[]');
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('empty array must throw');
});

Deno.test('normalizeDecimalRate — pads fraction', () => {
  const rate = normalizeDecimalRate('1.2');
  if (rate !== '1.200000') throw new Error(`pad failed: ${rate}`);
});
