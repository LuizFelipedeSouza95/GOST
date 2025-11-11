import { useEffect, useState } from "react";

const emblemImage = "/path_gost.svg";

export default function Inicio() {
    const [teamImage, setTeamImage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/equipe");
                const data = await res.json();
                const first = Array.isArray(data) ? (data[0] || null) : null;
                if (!cancelled && first?.imagem_url) setTeamImage(first.imagem_url as string);
            } catch {
                // ignore
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <section id="inicio" data-section-key="inicio">
            <h1 className="text-4xl font-bold text-slate-800 mb-6">ESTATUTO DE CONDUTA E OPERAÇÃO DO GOST</h1>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                <div className="mb-6 flex justify-center">
                    <img
						src={teamImage || emblemImage}
                        alt="Emblema oficial da GOST"
						className="h-60 w-60 object-contain rounded-md"
						referrerPolicy="no-referrer"
						crossOrigin="anonymous"
						onError={(e) => {
							const img = e.currentTarget as HTMLImageElement;
							if (img.src.endsWith("/path_gost.svg")) return;
							img.src = "/path_gost.svg";
						}}
                    />
                </div>
                <h2 className="text-2xl font-semibold text-slate-700 text-center mb-4">Grupamento Operacional de Supressão Tatica</h2>
                <div className="text-gray-600 max-w-2xl mx-auto space-y-4">
                    <p className="text-lg">
                        O patch combina diversos símbolos poderosos, sugerindo uma identidade ligada a forças especiais, unidades táticas, ou grupos de entusiastas militares/airsoft/jogos:
                    </p>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-700">1. O Lobo (O Símbolo Central)</h3>
                        <ul className="list-disc pl-6 text-left">
                            <li>
                                <span className="font-medium">Lealdade e Companheirismo:</span> Lobos são frequentemente associados a matilhas, simbolizando o trabalho em equipe, a lealdade e a fraternidade dentro de um grupo ou unidade.
                            </li>
                            <li>
                                <span className="font-medium">Instinto e Sobrevivência:</span> O lobo é um predador astuto, representando instinto aguçado, resiliência e habilidade de sobrevivência em ambientes hostis.
                            </li>
                            <li>
                                <span className="font-medium">Guerreiro Solitário (Lobo Solitário):</span> Em alguns contextos, pode simbolizar um combatente independente, líder ou alguém com a capacidade de operar efetivamente sozinho.
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-700">2. Óculos Táticos e Camuflagem (O Contexto Militar)</h3>
                        <ul className="list-disc pl-6 text-left">
                            <li>
                                <span className="font-medium">Prontidão e Proteção:</span> Os óculos de proteção indicam preparação para o combate e a importância de proteger os sentidos essenciais.
                            </li>
                            <li>
                                <span className="font-medium">Operações Especiais:</span> A camuflagem e os óculos táticos remetem diretamente ao ambiente militar e de operações táticas, sugerindo que o portador ou o grupo se considera uma força de elite ou de ação.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}