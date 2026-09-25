# Protótipo IndiqAI Card

Abra `index.html` no navegador ou publique o conteúdo desta pasta em uma hospedagem estática. Não há build. Para testar o QR localmente, execute `node tools/serve.cjs` e abra o endereço exibido no terminal.

Explore **Criar cartão**, **Cliente** e **Gestor**. Quando hospedado, o QR leva a configuração fictícia do cartão para a visão do cliente em outro aparelho. Os carimbos não sincronizam entre aparelhos, pois não há backend. Ao abrir como arquivo local, use o botão “Ver como cliente”. O botão **Recomeçar demonstração** restaura os dados fictícios neste navegador.

Tudo é demonstrativo e salvo apenas em `localStorage`. Não há login, pagamento, envio de mensagens, Wallet, backend ou dados de clientes reais.

`vendor/qrcode.js` é a biblioteca [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT, incluída localmente para que o QR funcione sem CDN.
