/** Lê uma variável que o compose passa aos testes, e falha com o nome dela quando falta. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não está definida no ambiente dos testes.`);
  }
  return value;
}
