export default function Disciplina() {
    return (
        <section id="disciplina">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">TÓPICO III. CONDUTA E DISCIPLINA</h1>
            <p className="text-lg text-gray-700 mb-6">Este tópico estabelece a <strong>doutrina disciplinar</strong> da GOST.</p>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">1. Padrão de Uniformização Pós-Q&amp;A</h2>
                    <p className="text-lg text-gray-700">
                        Após ser promovido a Soldado (1 Estrela), o operador terá <strong>quatro (4) meses</strong> para se adequar integralmente aos padrões de fardamento primário e secundário definidos pela GOST.
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200 bg-red-50">
                    <h2 className="text-2xl font-semibold text-slate-700 mb-4">2. Faltas e Remoção</h2>
                    <p className="text-lg text-gray-700">
                        A assiduidade é um pilar do comprometimento. Se o operador acumular <strong>três (3) faltas não justificadas</strong> (por escrito ao Comando de Squad) em treinamentos ou missões oficiais, ele será <strong>removido</strong> do grupo oficial de operadores e deverá <strong>entregar imediatamente o patch oficial da GOST</strong>.
                    </p>
                </div>
            </div>
        </section>
    );
}