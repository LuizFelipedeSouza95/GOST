import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import Inicio from "./components/sections/Inicio";
import Hierarquia from "./components/sections/Hierarquia";
import Recrutamento from "./components/sections/Recrutamento";
import Disciplina from "./components/sections/Disciplina";
import Uniformes from "./components/sections/Uniformes";
import Briefing from "./components/sections/Briefing";
import Logistica from "./components/sections/Logistica";

export type SectionKey =
    | "inicio"
    | "hierarquia"
    | "recrutamento"
    | "disciplina"
    | "uniformes"
    | "briefing"
    | "logistica";

const sectionsOrder: SectionKey[] = [
    "inicio",
    "hierarquia",
    "recrutamento",
    "disciplina",
    "uniformes",
    "briefing",
    "logistica"
];

export default function App() {
    const initialSection = useMemo<SectionKey>(() => {
		const p = window.location.pathname.replace(/^\/+/, "");
		const key = (p || "inicio") as SectionKey;
		return (sectionsOrder.includes(key) ? key : "inicio") as SectionKey;
    }, []);
    const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
		const handlePopState = () => {
			const p = window.location.pathname.replace(/^\/+/, "");
			const key = (p || "inicio") as SectionKey;
			if (sectionsOrder.includes(key)) {
				setActiveSection(key);
                window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                setMobileOpen(false);
            }
        };
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
		const path = activeSection === "inicio" ? "/" : `/${activeSection}`;
		if (window.location.pathname !== path) history.pushState(null, "", path);
    }, [activeSection]);

    const renderSection = () => {
        switch (activeSection) {
            case "inicio":
                return <Inicio />;
            case "hierarquia":
                return <Hierarquia />;
            case "recrutamento":
                return <Recrutamento />;
            case "disciplina":
                return <Disciplina />;
            case "uniformes":
                return <Uniformes />;
            case "briefing":
                return <Briefing />;
            case "logistica":
                return <Logistica />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex font-sans bg-slate-100">
			<MobileHeader active={activeSection} onChange={setActiveSection} />
            <Sidebar active={activeSection} onChange={setActiveSection} />
            <main className="flex-1 md:ml-64 mt-16 md:mt-0 p-6 md:p-10 overflow-y-auto">
                {renderSection()}
            </main>
        </div>
    );
}