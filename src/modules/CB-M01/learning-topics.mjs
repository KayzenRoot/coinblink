// Evergreen learning content. This is educational text, not a news or market feed.
// No credentials, trading advice, price data, external scripts or storage.
const TOPICS = Object.freeze([
  Object.freeze({
    id: "wallets", icon: "◈",
    en: Object.freeze({
      title: "What does a crypto wallet hold?",
      summary: "A wallet manages the keys used to authorize transactions. Assets are recorded on a network, not stored inside the app.",
      checklist: "Before using one, check who controls the keys and what recovery options exist.",
    }),
    pt: Object.freeze({
      title: "O que uma carteira cripto guarda?",
      summary: "A carteira gerencia as chaves usadas para autorizar transações. Os ativos ficam registrados na rede, não dentro do aplicativo.",
      checklist: "Antes de usar uma, verifique quem controla as chaves e como funciona a recuperação.",
    }),
  }),
  Object.freeze({
    id: "recovery", icon: "✣",
    en: Object.freeze({
      title: "Protect your recovery phrase",
      summary: "A recovery phrase can restore access to many self-custody wallets. Anyone who obtains it may be able to control the assets.",
      checklist: "Never enter your recovery phrase into a website or share it with support agents.",
    }),
    pt: Object.freeze({
      title: "Proteja sua frase de recuperação",
      summary: "A frase de recuperação pode restaurar o acesso a várias carteiras de autocustódia. Quem a obtiver poderá controlar os ativos.",
      checklist: "Nunca digite sua frase de recuperação em sites ou a compartilhe com atendentes.",
    }),
  }),
  Object.freeze({
    id: "networks", icon: "⬡",
    en: Object.freeze({
      title: "Choose the correct network",
      summary: "The same asset name may appear on different networks. Network addresses, tokens and transfer fees are not always interchangeable.",
      checklist: "Confirm the network, token contract and destination before transferring assets.",
    }),
    pt: Object.freeze({
      title: "Escolha a rede correta",
      summary: "Um ativo com o mesmo nome pode existir em redes diferentes. Endereços, tokens e taxas de transferência nem sempre são compatíveis.",
      checklist: "Confira rede, contrato do token e destino antes de transferir ativos.",
    }),
  }),
  Object.freeze({
    id: "confirmations", icon: "◎",
    en: Object.freeze({
      title: "How can I verify a transaction?",
      summary: "A transaction hash lets you look up a submitted transaction in a network explorer. Confirmation status differs by network.",
      checklist: "Check the transaction status, network, addresses and amount rather than trusting a screenshot.",
    }),
    pt: Object.freeze({
      title: "Como verificar uma transação?",
      summary: "O hash permite consultar uma transação enviada em um explorador da rede. O estado de confirmação varia conforme a rede.",
      checklist: "Verifique estado, rede, endereços e valor, em vez de confiar apenas em uma captura de tela.",
    }),
  }),
  Object.freeze({
    id: "approvals", icon: "⌁",
    en: Object.freeze({
      title: "Understand token approvals",
      summary: "Some applications request permission for a smart contract to spend your tokens. An approval can remain active after the first transaction.",
      checklist: "Read what a wallet request authorizes, and review or revoke unused approvals where supported.",
    }),
    pt: Object.freeze({
      title: "Entenda as autorizações de tokens",
      summary: "Alguns aplicativos pedem permissão para um contrato inteligente gastar seus tokens. A autorização pode continuar ativa após a primeira transação.",
      checklist: "Leia o que a carteira solicita e revise ou revogue autorizações sem uso quando possível.",
    }),
  }),
  Object.freeze({
    id: "risk", icon: "!",
    en: Object.freeze({
      title: "Recognize risk before buying",
      summary: "Cryptoassets can be highly volatile. A token listing, social post or claimed return is not proof of safety or liquidity.",
      checklist: "Check independent sources, contract details and your risk limits; avoid promises of guaranteed profit.",
    }),
    pt: Object.freeze({
      title: "Reconheça riscos antes de comprar",
      summary: "Criptoativos podem oscilar muito. Listagens, publicações e promessas de retorno não comprovam segurança ou liquidez.",
      checklist: "Consulte fontes independentes, detalhes do contrato e seus limites de risco. Desconfie de lucro garantido.",
    }),
  }),
]);

export function getLearningTopics(locale = "en") {
  return TOPICS.map(({ id, icon, en, pt }) =>
    Object.freeze({ id, icon, ...(locale === "pt-br" ? pt : en) }));
}
