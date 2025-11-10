export default function Briefing() {
    const briefingItems = [
        {
            element: "MISSÃO",
            description: "Objetivo Primário e Secundário. Condições de Vitória/Derrota.",
        },
        {
            element: "EXECUÇÃO",
            description: "Mapa de Área, ROE (Regras de Engajamento Específicas), Restrições de Tempo.",
        },
        {
            element: "COMUNICAÇÕES",
            description: "Frequências de Rádio, Indicativos de Chamada, Códigos Táticos Específicos.",
        },
        {
            element: "CONTINGÊNCIA",
            description: "Plano B para falha de comunicação, perda do objetivo primário ou desorganização do Squad.",
        },
    ];

    return (
        <section id="briefing">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">TÓPICO V. PLANEJAMENTO DE MISSÕES (BRIEFING TÁTICO)</h1>
            <p className="text-lg text-gray-700 mb-6">
                Todo Briefing de Missão seguirá a estrutura M-E-C-C e será liderado pelo Comando ou Subcomando.
            </p>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Mobile: cards empilhados, sem scroll horizontal */}
                <div className="p-4 space-y-4 md:hidden">
                    {briefingItems.map((item) => (
                        <div key={item.element} className="rounded-lg border border-gray-200 p-4">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Elemento</div>
                            <div className="text-base font-semibold text-gray-900">{item.element}</div>
                            <div className="mt-2 text-sm text-gray-600">{item.description}</div>
                        </div>
                    ))}
                </div>
                {/* Desktop: mantém tabela */}
                <div className="hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elemento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {briefingItems.map((item) => (
                                <tr key={item.element}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.element}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}