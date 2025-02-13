const formatNumberWithCommas = (value) => {
  return value ? parseFloat(value).toLocaleString() : "";
};

export { formatNumberWithCommas };
