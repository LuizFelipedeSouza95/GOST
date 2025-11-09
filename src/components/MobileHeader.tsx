import type { SectionKey } from "../App";
import { useState } from "react";

type Props = {
	active: SectionKey;
	onChange: (section: SectionKey) => void;
};

const items: { key: SectionKey; label: string }[] = [
	{ key: "inicio", label: "Início" },
	{ key: "recrutamento", label: "Recrutamento (Q&A)" },
	{ key: "hierarquia", label: "Hierarquia" },
	{ key: "disciplina", label: "Conduta e Disciplina" },
	{ key: "uniformes", label: "Uniformes (Kit GOST)" },
	{ key: "briefing", label: "Briefing de Missão" },
	{ key: "logistica", label: "Logística e Horários" }
];

export default function MobileHeader({ active, onChange }: Props) {
	const [open, setOpen] = useState(false);
	return (
		<header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white border-b border-slate-700">
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex flex-col items-start gap-1">
					<div className="flex flex-row items-center gap-2">
						<a href="/"><img src="/path_gost.svg" alt="Logo GOST" className="w-8 h-8 object-cover rounded-md" /></a>
						<span className="font-semibold">GOST</span>
					</div>
					<span className="text-xs text-white italic text-left">Grupamento Operacional de Supressão Tatica</span>
				</div>
				<button
					aria-label="Abrir menu"
					className="p-2 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
					onClick={() => setOpen((v) => !v)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
						<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				</button>
			</div>
			{open && (
				<nav className="px-2 pb-3">
					<ul>
						{items.map((item) => (
							<li key={item.key}>
								<a
									href={item.key === "inicio" ? "/" : `/${item.key}`}
									className={`nav-link block px-3 py-2 rounded text-base ${active === item.key ? "active" : ""}`}
									onClick={(e) => {
										e.preventDefault();
										onChange(item.key);
										setOpen(false);
									}}
								>
									{item.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
			)}
		</header>
	);
}