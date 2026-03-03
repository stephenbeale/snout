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
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(str);
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
