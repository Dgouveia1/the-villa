document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('happy-hour-form');
    const submitButton = document.getElementById('submit-button');
    const feedbackMessage = document.getElementById('feedback-message');
    const webhookUrl = 'https://webhook.ia-tess.com.br/webhook/qr-code-the-vila';

    form.addEventListener('submit', async (event) => {
        // Previne o comportamento padrão do formulário de recarregar a página
        event.preventDefault();

        // Desabilita o botão para evitar múltiplos envios
        submitButton.disabled = true;
        feedbackMessage.textContent = 'Enviando...';
        feedbackMessage.className = '';

        // 1. Coleta os dados do formulário
        const userInput = document.getElementById('user-input').value;
        const choppQuantityInput = document.querySelector('input[name="chopp"]:checked');
        
        // Pega o valor do chopp selecionado. Se nenhum for selecionado, assume 0.
        const choppQuantity = choppQuantityInput ? choppQuantityInput.value : '0';

        // 2. Prepara os dados para enviar ao webhook
        const dataToSend = {
            // O n8n geralmente espera o nome do usuário (pode ser anônimo) e a quantidade
            user: userInput || 'Anônimo',
            quantity: parseInt(choppQuantity, 10), // Converte para número
            timestamp: new Date().toISOString()
        };

        try {
            // 3. Envia os dados usando a API Fetch
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            // Verifica se o webhook respondeu com sucesso
            if (response.ok) {
                feedbackMessage.textContent = 'Happy Hour adicionado com sucesso! 🎉';
                feedbackMessage.className = 'success';
                form.reset(); // Limpa o formulário
            } else {
                // Se o servidor retornar um erro (ex: 404, 500)
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ocorreu um erro no servidor.');
            }

        } catch (error) {
            // Se houver um erro de rede ou na lógica
            console.error('Erro ao enviar para o webhook:', error);
            feedbackMessage.textContent = `Erro ao enviar. Tente novamente.`;
            feedbackMessage.className = 'error';
        } finally {
            // Reabilita o botão após 2 segundos, independentemente do resultado
            setTimeout(() => {
                submitButton.disabled = false;
                if (!feedbackMessage.classList.contains('error')) {
                    feedbackMessage.textContent = '';
                }
            }, 2000);
        }
    });
});