const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatGBP(value) {
  return gbpFormatter.format(value);
}

export function formatDate(dateString) {
  const str = String(dateString);
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, day] = str.split("-").map(Number);
    const candidate = new Date(y, m - 1, day);
    const valid =
      candidate.getFullYear() === y &&
      candidate.getMonth() === m - 1 &&
      candidate.getDate() === day;
    d = valid ? candidate : new Date(NaN);
  } else {
    d = new Date(str);
  }
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
