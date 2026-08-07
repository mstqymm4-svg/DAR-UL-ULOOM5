// Small helpers shared by every entity route.
// The frontend (inherited from the previous Base44 setup) speaks snake_case
// field names (created_date, cover_image, is_featured...). Prisma models use
// camelCase. These helpers translate both ways so the React code did not
// have to be rewritten field-by-field.

export function toApiRow(row, fieldMap, dateFields = ['createdDate', 'updatedDate']) {
  if (!row) return row;
  const out = { id: row.id };
  for (const [apiKey, dbKey] of Object.entries(fieldMap)) {
    let value = row[dbKey];
    if (dateFields.includes(dbKey) && value instanceof Date) {
      value = value.toISOString();
    }
    out[apiKey] = value;
  }
  return out;
}

// Builds a Prisma `data` object from an incoming API body, using only known
// writable fields (never trusts the client with id/createdDate/updatedDate).
export function fromApiBody(body, writableFieldMap) {
  const data = {};
  for (const [apiKey, dbKey] of Object.entries(writableFieldMap)) {
    if (Object.prototype.hasOwnProperty.call(body, apiKey)) {
      data[dbKey] = body[apiKey];
    }
  }
  return data;
}

// Parses Base44-style `sort` ("-created_date" / "title") and `limit` query params.
export function parseListParams(query, fieldMap, defaultSortDbKey = 'createdDate') {
  let orderBy = { [defaultSortDbKey]: 'desc' };
  if (query.sort) {
    const desc = query.sort.startsWith('-');
    const apiKey = desc ? query.sort.slice(1) : query.sort;
    const dbKey = fieldMap[apiKey] || defaultSortDbKey;
    orderBy = { [dbKey]: desc ? 'desc' : 'asc' };
  }
  const take = query.limit ? Math.min(Number(query.limit) || 1000, 5000) : undefined;
  return { orderBy, take };
}

// Any other query params are treated as equality filters (Base44 `.filter()` style).
export function parseEqualityFilters(query, fieldMap, reserved = ['sort', 'limit']) {
  const where = {};
  for (const [key, value] of Object.entries(query)) {
    if (reserved.includes(key)) continue;
    const dbKey = fieldMap[key];
    if (!dbKey) continue;
    if (value === 'true') where[dbKey] = true;
    else if (value === 'false') where[dbKey] = false;
    else where[dbKey] = value;
  }
  return where;
}
