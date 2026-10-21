export type WorkLoadStatus = 'ok' | 'empty' | 'error';
export interface WorkLoadEvent {
	done: (status: WorkLoadStatus) => void;
}
