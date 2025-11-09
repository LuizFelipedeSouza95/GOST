export default function Recrutamento() {
    return (
        <section id="recrutamento">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">TÓPICO II. INGRESSO E AVALIAÇÃO (Q&A)</h1>
            <p className="text-lg text-gray-700 mb-6">
                O processo de ingresso é rigoroso e visa garantir que apenas operadores comprometidos e disciplinados façam parte do efetivo.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">1. Requisitos Básicos</h2>
                    <ul className="list-disc list-inside space-y-3 text-lg text-gray-700">
                        <li>
                            <strong>Conduta:</strong> Demonstrar integridade e respeito intransigentes às regras do Airsoft, à hierarquia do GOST e aos membros de outras equipes em todos os momentos.
                        </li>
                        <li>
                            <strong>Comprometimento:</strong> Disponibilidade para participar de treinamentos e operações.
                        </li>
                    </ul>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">2. Fase de Recrutamento (Q&A)</h2>
                    <ul className="list-disc list-inside space-y-3 text-lg text-gray-700">
                        <li>
                            <strong>Duração:</strong> Mínimo de <strong>3 meses</strong> sem faltas nos treinamentos.
                        </li>
                        <li>
                            <strong>Uniforme:</strong> O Recruta usará o <strong>Padrão PMC (Tático)</strong> e <strong>não portará o patch oficial da GOST</strong>.
                        </li>
                        <li>
                            <strong>Acompanhamento:</strong> É altamente encorajado que cada Recruta seja designado a um <strong>Mentor (Padrinho)</strong>.
                        </li>
                        <li>
                            <strong>Promoção:</strong> Só ascenderá a Soldado (1 Estrela) e receberá o <strong>patch oficial</strong> após aprovação da Cadeia de Comando.
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
}