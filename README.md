# Protótipo IndiqAI Card

Abra `index.html` no navegador ou publique o conteúdo desta pasta em uma hospedagem estática. Não há build. Para testar o QR localmente, execute `node tools/serve.cjs` e abra o endereço exibido no terminal.

Explore a entrada, **Meus cartões**, o onboarding de três passos, **Meu cartão** do cliente e o painel da empresa. O protótipo foi desenhado primeiro para o celular. O gestor escolhe manualmente a quantidade de carimbos por atendimento.

Quando hospedado, o QR leva a configuração fictícia do cartão para outro aparelho. Imagens enviadas e carimbos ficam no navegador e não sincronizam, pois não há backend. O botão **Recomeçar** restaura os dados fictícios. Login social e Wallet são apenas simulações identificadas na interface.

Tudo é demonstrativo e salvo em `localStorage`. Não há autenticação real, pagamento, envio de mensagens, integração com Wallet, backend ou dados de clientes reais. Os indicadores do painel são um cenário fictício; valores de compras não são inferidos dos carimbos.

`vendor/qrcode.js` é a biblioteca [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT, incluída localmente para que o QR funcione sem CDN.
