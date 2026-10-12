// Evergreen, non-live educational material; no external feeds or credentials.
// Parallel translations share one row to avoid duplicated data wiring.
const TOPIC_ROWS = Object.freeze([
  ["wallets", "◈", "What does a crypto wallet hold?", "A wallet manages the keys used to authorize transactions. Assets are recorded on a network, not stored inside the app.", "Before using one, check who controls the keys and what recovery options exist.", "O que uma carteira cripto guarda?", "A carteira gerencia as chaves usadas para autorizar transações. Os ativos ficam registrados na rede, não dentro do aplicativo.", "Antes de usar uma, verifique quem controla as chaves e como funciona a recuperação."],
  ["recovery", "✣", "Protect your recovery phrase", "A recovery phrase can restore access to many self-custody wallets. Anyone who obtains it may be able to control the assets.", "Never enter your recovery phrase into a website or share it with support agents.", "Proteja sua frase de recuperação", "A frase de recuperação pode restaurar o acesso a várias carteiras de autocustódia. Quem a obtiver poderá controlar os ativos.", "Nunca digite sua frase de recuperação em sites ou a compartilhe com atendentes."],
  ["networks", "⬡", "Choose the correct network", "The same asset name may appear on different networks. Network addresses, tokens and transfer fees are not always interchangeable.", "Confirm the network, token contract and destination before transferring assets.", "Escolha a rede correta", "Um ativo com o mesmo nome pode existir em redes diferentes. Endereços, tokens e taxas de transferência nem sempre são compatíveis.", "Confira rede, contrato do token e destino antes de transferir ativos."],
  ["confirmations", "◎", "How can I verify a transaction?", "A transaction hash lets you look up a submitted transaction in a network explorer. Confirmation status differs by network.", "Check the transaction status, network, addresses and amount rather than trusting a screenshot.", "Como verificar uma transação?", "O hash permite consultar uma transação enviada em um explorador da rede. O estado de confirmação varia conforme a rede.", "Verifique estado, rede, endereços e valor, em vez de confiar apenas em uma captura de tela."],
  ["approvals", "⌁", "Understand token approvals", "Some applications request permission for a smart contract to spend your tokens. An approval can remain active after the first transaction.", "Read what a wallet request authorizes, and review or revoke unused approvals where supported.", "Entenda as autorizações de tokens", "Alguns aplicativos pedem permissão para um contrato inteligente gastar seus tokens. A autorização pode continuar ativa após a primeira transação.", "Leia o que a carteira solicita e revise ou revogue autorizações sem uso quando possível."],
  ["risk", "!", "Recognize risk before buying", "Cryptoassets can be highly volatile. A token listing, social post or claimed return is not proof of safety or liquidity.", "Check independent sources, contract details and your risk limits; avoid promises of guaranteed profit.", "Reconheça riscos antes de comprar", "Criptoativos podem oscilar muito. Listagens, publicações e promessas de retorno não comprovam segurança ou liquidez.", "Consulte fontes independentes, detalhes do contrato e seus limites de risco. Desconfie de lucro garantido."]
]);

export function getLearningTopics(locale = "en") {
  const pt = locale === "pt-br";
  return TOPIC_ROWS.map((row) => Object.freeze({
    id: row[0],
    icon: row[1],
    title: row[pt ? 5 : 2],
    summary: row[pt ? 6 : 3],
    checklist: row[pt ? 7 : 4],
  }));
}
