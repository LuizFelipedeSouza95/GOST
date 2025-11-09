import type { SectionKey } from "../App";
import logoGost from "../assets/path_gost.svg";

type Props = {
    active: SectionKey;
    onChange: (section: SectionKey) => void;
};

const items: { key: SectionKey; label: string }[] = [
    { key: "inicio", label: "Início" },
    { key: "hierarquia", label: "Hierarquia" },
    { key: "recrutamento", label: "Recrutamento (Q&A)" },
    { key: "disciplina", label: "Conduta e Disciplina" },
    { key: "uniformes", label: "Uniformes (Kit GOST)" },
    { key: "briefing", label: "Briefing de Missão" },
    { key: "logistica", label: "Logística e Horários" }
];

export default function Sidebar({ active, onChange }: Props) {
    return (
        <nav className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-gray-300 shadow-lg fixed h-full">
            <div className="flex flex-col items-center justify-center gap-2 border-b border-slate-700">
                <div className="flex flex-row items-center justify-center">
                    <img src={logoGost} alt="Logo GOST" className="w-10 h-10 object-cover rounded-md" />
                    <span className="text-2xl font-bold text-white">GOST</span><br />
                </div>
                <span className="text-lg text-white italic text-center">Grupamento Operacional de Supressão Tatica</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                <ul id="desktop-nav">
                    {items.map((item) => (
                        <li key={item.key}>
                            <a
                                href={`#${item.key}`}
                                className={`nav-link block p-4 text-lg ${active === item.key ? "active" : ""
                                    }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onChange(item.key);
                                }}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}