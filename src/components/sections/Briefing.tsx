export default function Briefing() {
    return (
        <section id="briefing">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">TÓPICO V. PLANEJAMENTO DE MISSÕES (BRIEFING TÁTICO)</h1>
            <p className="text-lg text-gray-700 mb-6">
                Todo Briefing de Missão seguirá a estrutura M-E-C-C e será liderado pelo Comando ou Subcomando.
            </p>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elemento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MISSÃO</td>
                                <td className="px-6 py-4 text-sm text-gray-600">Objetivo Primário e Secundário. Condições de Vitória/Derrota.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EXECUÇÃO</td>
                                <td className="px-6 py-4 text-sm text-gray-600">Mapa de Área, ROE (Regras de Engajamento Específicas), Restrições de Tempo.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">COMUNICAÇÕES</td>
                                <td className="px-6 py-4 text-sm text-gray-600">Frequências de Rádio, Indicativos de Chamada, Códigos Táticos Específicos.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">CONTINGÊNCIA</td>
                                <td className="px-6 py-4 text-sm text-gray-600">Plano B para falha de comunicação, perda do objetivo primário ou desorganização do Squad.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

