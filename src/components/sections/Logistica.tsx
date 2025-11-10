export default function Logistica() {
    return (
        <section id="logistica">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">TÓPICO VI. LOGÍSTICA OPERACIONAL E COMPROMISSO</h1>
            <p className="text-lg text-gray-700 mb-6">
                A participação nas atividades agendadas é obrigatória para a manutenção da proficiência e coesão tática.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">1. Dias e Horários Oficiais</h2>
                    <p className="text-lg text-gray-700">As atividades e treinamentos oficiais da GOST ocorrem:</p>
                    <p className="text-2xl font-bold text-emerald-600 my-4">Todos os domingos, entre 07h30 e 16h00.</p>
                    <p className="text-lg text-gray-700">O local de engajamento será definido e comunicado na página de jogos. <a href="/jogos" className="clique-aqui">Clique aqui</a> para ver os jogos agendados.</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">2. Café Solidário (Logística de Apoio)</h2>
                    <p className="text-lg text-gray-700">
                        O <strong>&quot;Café Solidário&quot;</strong> é um esforço voluntário de coesão, onde os operadores são <strong>incentivados</strong> a contribuir com itens de alimentação ou bebida para garantir o suprimento mútuo.
                    </p>
                    <p className="text-lg text-gray-700 mt-2 font-semibold">A contribuição <strong>não é obrigatória</strong>.</p>
                </div>
            </div>
        </section>
    );
}