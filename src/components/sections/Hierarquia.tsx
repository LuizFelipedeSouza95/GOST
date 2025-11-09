export default function Hierarquia() {
    return (
        <section id="hierarquia">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">TÓPICO I. DISPOSIÇÕES GERAIS E HIERARQUIA</h1>
            <p className="text-lg text-gray-700 mb-6">
                A eficiência tática é mantida pela clareza na cadeia de comando. Ordens e relatórios de contato (intel) fluem do topo para a base e vice-versa, de forma organizada.
            </p>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 mb-6">
                <h2 className="text-2xl font-semibold text-slate-700 p-6 bg-gray-50 border-b">1. Estrutura de Comando</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distintivo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função Tática</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terminologia</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Comando Geral</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">4 Estrelas</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Doutrina, Estratégia e Decisão Final.</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Comandante</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Subcomando</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">3 Estrelas</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Gestão Tática, Logística de Missão, Apoio Direto.</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Sub</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Comando de Squad</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">2 Estrelas</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Liderança no Terreno (LDT), Execução Tática do Squad.</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Líder de Squad</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Operador/Soldado</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">1 Estrela</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Execução de Ordens, Segurança de Setor, Patrulha.</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Soldado / Operador</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-semibold text-slate-700 mb-4">2. Disciplina Tática</h2>
                <p className="text-lg text-gray-700">
                    A contestação de ordens em campo é proibida. Quaisquer dúvidas ou sugestões devem ser levadas ao Líder de Squad após o engajamento ou na fase de Pós-Briefing.
                </p>
            </div>
        </section>
    );
}