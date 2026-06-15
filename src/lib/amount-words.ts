const UNITS = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante",
  "quatre-vingt",
  "quatre-vingt",
];

function underHundred(n: number): string {
  if (n < 20) return UNITS[n];
  if (n < 70) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (unit === 0) return TENS[ten];
    if (unit === 1 && ten !== 8) return `${TENS[ten]}-et-un`;
    return `${TENS[ten]}-${UNITS[unit]}`;
  }
  if (n < 80) {
    const rest = n - 60;
    return rest === 11 ? "soixante-onze" : `soixante-${underHundred(rest)}`;
  }
  if (n < 100) {
    const rest = n - 80;
    if (rest === 0) return "quatre-vingts";
    return `quatre-vingt-${underHundred(rest)}`;
  }
  return "";
}

function underThousand(n: number): string {
  if (n < 100) return underHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredWord =
    hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${rest === 0 && hundreds > 1 ? "s" : ""}`;
  return rest === 0 ? hundredWord : `${hundredWord} ${underHundred(rest)}`;
}

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n < 1000) return underThousand(n);
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thousandWord =
      thousands === 1 ? "mille" : `${chunkToWords(thousands)} mille`;
    return rest === 0 ? thousandWord : `${thousandWord} ${chunkToWords(rest)}`;
  }
  if (n < 1_000_000_000) {
    const millions = Math.floor(n / 1_000_000);
    const rest = n % 1_000_000;
    const millionWord =
      millions === 1 ? "un million" : `${chunkToWords(millions)} millions`;
    return rest === 0 ? millionWord : `${millionWord} ${chunkToWords(rest)}`;
  }
  const milliards = Math.floor(n / 1_000_000_000);
  const rest = n % 1_000_000_000;
  const milliardWord =
    milliards === 1 ? "un milliard" : `${chunkToWords(milliards)} milliards`;
  return rest === 0 ? milliardWord : `${milliardWord} ${chunkToWords(rest)}`;
}

export function amountToWordsFCFA(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "zéro franc CFA";
  const words = chunkToWords(rounded);
  return `${words} franc${rounded > 1 ? "s" : ""} CFA`;
}
