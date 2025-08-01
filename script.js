document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÕES DO SUPABASE ---
    const SUPABASE_URL = 'https://xjxwghcvmrzeuoovamnb.supabase.co'; 
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqeHdnaGN2bXJ6ZXVvb3ZhbW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDkwNDIsImV4cCI6MjA2NjUyNTA0Mn0.ajRXJddLF-oTrP19knDB4eEsg-p33F_wi3MU-Xxly3s'; // IMPORTANTE: Cole sua chave ANON aqui!

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- ELEMENTOS DO DOM ---
    const clockDisplay = document.getElementById('clock-display');
    const notificationArea = document.getElementById('notification-area');

    // --- VARIÁVEIS GLOBAIS ---
    let totalSeconds = 0;
    let timerInterval = null;

    // --- FUNÇÕES PRINCIPAIS ---

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateClock() {
        if (totalSeconds > 0) {
            totalSeconds--;
        } else {
            totalSeconds = 0;
        }
        clockDisplay.textContent = formatTime(totalSeconds);
    }

    function showNotification(user, minutes) {
        const userName = user || 'Alguém';
        notificationArea.textContent = `+${minutes} min de happy hour por conta de @${userName}! 🍻`;
        notificationArea.classList.add('show');
        setTimeout(() => {
            notificationArea.classList.remove('show');
        }, 5000);
    }

    function listenForTimeUpdates() {
        console.log('Ouvindo atualizações de tempo...');
        supabaseClient
            .channel('timer_state_changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'timer_state', filter: 'id=eq.1' },
                (payload) => {
                    console.log('Recebida atualização de tempo!', payload);
                    totalSeconds = payload.new.total_seconds;
                    clockDisplay.textContent = formatTime(totalSeconds);
                }
            )
            .subscribe();
    }
    
    function listenForNotifications() {
        console.log('Ouvindo novos eventos para notificações...');
        supabaseClient
            .channel('events_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'events' },
                (payload) => {
                    console.log('Novo evento recebido!', payload);
                    showNotification(payload.new.user_name, payload.new.minutes_added);
                }
            )
            .subscribe();
    }

    async function initializeClock() {
        try {
            console.log('Inicializando o relógio...');
            
            // --- MUDANÇA PRINCIPAL APLICADA AQUI ---
            // Removemos .single() para aceitar um array como resposta.
            const { data, error } = await supabaseClient
                .from('timer_state')
                .select('total_seconds')
                .eq('id', 1);

            if (error) {
                // Se houver um erro de rede ou permissão, ele será capturado aqui.
                throw error;
            }

            // Verificamos se o array de dados não está vazio.
            if (data && data.length > 0) {
                // Se encontramos dados, usamos o tempo da primeira linha.
                totalSeconds = data[0].total_seconds;
            } else {
                // Se a tabela estiver vazia, iniciamos com 0 e avisamos no console.
                totalSeconds = 0;
                console.warn("AVISO: A tabela 'timer_state' está vazia ou não contém a linha com id=1. O relógio iniciará em 0.");
            }
            
            console.log(`Tempo inicial carregado: ${totalSeconds} segundos.`);
            
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateClock, 1000);

            listenForTimeUpdates();
            listenForNotifications();

        } catch (error) {
            console.error('Erro CRÍTICO ao inicializar o relógio:', error.message);
            clockDisplay.textContent = "ERRO";
        }
    }

    initializeClock();
});
