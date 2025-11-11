import type { IncomingMessage, ServerResponse } from "http";

export type ApiCtx = {
	req: IncomingMessage;
	res: ServerResponse;
	url: URL;
	id: string | undefined;
	method: string;
	em: any;
	readJson: (req: IncomingMessage) => Promise<any>;
	send: (code: number, body: any) => void;
};

export type Handler = (ctx: ApiCtx) => Promise<boolean | void>;


