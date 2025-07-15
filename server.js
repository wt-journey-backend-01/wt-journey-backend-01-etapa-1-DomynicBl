const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// --- Middlewares ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Rota Principal (index.html) - Gerada Dinamicamente com Modal ---
app.get('/', async (req, res) => {
    try {
        const lanchesData = await fs.readFile(path.join(__dirname, 'public', 'data', 'lanches.json'), 'utf-8');
        const lanches = JSON.parse(lanchesData);

        let cardapioItemsHTML = '';
        lanches.forEach(lanche => {
            cardapioItemsHTML += `
                <div class="cardapio-item" data-id="${lanche.id}">
                    <img src="${lanche.imagem}" alt="Imagem de um ${lanche.nome}" class="burger-image">
                    <h3>${lanche.nome}</h3>
                    <p>${lanche.ingredientes}</p>
                </div>
            `;
        });
        
        const lanchesJSONString = JSON.stringify(lanches);

        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DevBurger - Cardápio</title>
                <link rel="stylesheet" href="/css/style.css">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Lobster&display=swap" rel="stylesheet">
            </head>
            <body>
                <header class="header">
                    <div class="container">
                        <h1 class="logo">DevBurger</h1>
                        <nav><a href="/contato">Contato</a><a href="/api/lanches" target="_blank">API de Lanches</a></nav>
                    </div>
                </header>

                <main class="container">
                    <section id="cardapio" class="section">
                        <h2>Nosso Cardápio</h2>
                        <div class="cardapio-grid">
                            ${cardapioItemsHTML}
                        </div>
                    </section>
                    <section id="sugestao" class="section">
                        <h2>Sugira um Novo Lanche!</h2>
                        <form action="/sugestao" method="GET" class="form-container">
                            <div class="form-group"><label for="nome">Nome do Lanche:</label><input type="text" id="nome" name="nome" required></div>
                            <div class="form-group"><label for="ingredientes">Ingredientes:</label><textarea id="ingredientes" name="ingredientes" rows="4" required placeholder="Ex: pão, carne, queijo..."></textarea></div>
                            <button type="submit" class="btn">Enviar Sugestão</button>
                        </form>
                    </section>
                </main>

                <footer class="footer">
                    <div class="container"><p>&copy; ${new Date().getFullYear()} DevBurger. Todos os direitos reservados.</p></div>
                </footer>

                <div id="modal-container" class="modal-container">
                    <div id="modal-box" class="modal-box">
                        <button id="modal-close-btn" class="modal-close-btn">&times;</button>
                        <h3 id="modal-title"></h3>
                        <div class="modal-section">
                            <p id="modal-description"></p>
                        </div>
                        <div class="modal-section">
                            <h4>Tabela Nutricional (valores por porção)</h4>
                            <div id="modal-nutrition" class="tabela-nutricional"></div>
                        </div>
                        <div class="modal-section">
                            <h4>Alérgicos</h4>
                            <p id="modal-allergens"></p>
                        </div>
                    </div>
                </div>

                <script>
                    const lanchesData = ${lanchesJSONString};

                    const cardapioItems = document.querySelectorAll('.cardapio-item');
                    const modalContainer = document.getElementById('modal-container');
                    const modalCloseBtn = document.getElementById('modal-close-btn');
                    
                    function showModal(lanche) {
                        document.getElementById('modal-title').textContent = lanche.nome;
                        document.getElementById('modal-description').textContent = lanche.detalhes.descricao;
                        document.getElementById('modal-allergens').textContent = lanche.detalhes.alergenicos;

                        const nutritionDiv = document.getElementById('modal-nutrition');
                        nutritionDiv.innerHTML = '';
                        for (const [key, value] of Object.entries(lanche.detalhes.tabelaNutricional)) {
                            const nutritionItem = document.createElement('div');
                            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                            nutritionItem.innerHTML = \`<span>\${value}</span> \${capitalizedKey}\`;
                            nutritionDiv.appendChild(nutritionItem);
                        }
                        
                        modalContainer.classList.add('mostrar');
                    }

                    function hideModal() {
                        modalContainer.classList.remove('mostrar');
                    }

                    cardapioItems.forEach(item => {
                        item.addEventListener('click', () => {
                            const lancheId = item.getAttribute('data-id');
                            const lancheSelecionado = lanchesData.find(l => l.id == lancheId);
                            if (lancheSelecionado) {
                                showModal(lancheSelecionado);
                            }
                        });
                    });

                    modalCloseBtn.addEventListener('click', hideModal);
                    modalContainer.addEventListener('click', (event) => {
                        if (event.target === modalContainer) {
                            hideModal();
                        }
                    });

                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Erro ao processar a rota principal:', error);
        res.status(500).send('<h1>Erro 500: Erro interno ao carregar o cardápio.</h1>');
    }
});

// --- Outras Rotas (Contato, API, Sugestão, 404, etc.) ---
app.get('/contato', (req, res) => { res.sendFile(path.join(__dirname, 'views', 'contato.html')); });
app.get('/api/lanches', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'data', 'lanches.json')); });
app.get('/sugestao', (req, res) => { const { nome, ingredientes } = req.query; res.send(`<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>DevBurger - Sugestão Recebida!</title><link rel="stylesheet" href="/css/style.css"></head><body><main class="container"><section class="section"><h2>Obrigado pela sua sugestão!</h2><p>Recebemos sua ideia para o lanche <strong>${nome}</strong>.</p><p>Ingredientes sugeridos: <strong>${ingredientes}</strong></p><br><a href="/" class="btn">Voltar ao Cardápio</a></section></main></body></html>`); });
app.post('/contato', (req, res) => { res.redirect('/contato-recebido'); });
app.get('/contato-recebido', (req, res) => { res.send(`<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>DevBurger - Contato Recebido!</title><link rel="stylesheet" href="/css/style.css"></head><body><main class="container"><section class="section"><h2>Mensagem Recebida!</h2><p>Obrigado por entrar em contato. Recebemos sua mensagem e retornaremos em breve!</p><br><a href="/" class="btn">Voltar à Página Inicial</a></section></main></body></html>`); });
app.use((req, res) => { res.status(404).sendFile(path.join(__dirname, 'public', '404.html')); });

app.listen(PORT, () => {
    console.log(`Servidor da DevBurger rodando em http://localhost:${PORT}`);
});