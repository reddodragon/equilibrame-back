export function resolveDatabaseUrl(
  databaseUrl: string | undefined,
  databasePassword: string | undefined,
): string | undefined {
  if (!databaseUrl || !databasePassword) {
    return databaseUrl;
  }

  const parsedUrl = new URL(databaseUrl);
  parsedUrl.password = databasePassword;

  return parsedUrl.toString();
}
