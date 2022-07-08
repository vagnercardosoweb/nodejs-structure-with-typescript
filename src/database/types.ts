export interface CreatedAt {
	created_at: Date;
}

export interface UpdatedAt {
	updated_at: Date;
}

export interface DeletedAt {
	deleted_at: Date;
}

export interface Timestamp extends CreatedAt, UpdatedAt {}

export interface TimestampWithSoftDelete extends Timestamp, DeletedAt {}

type FnHook = () => Promise<void> | void;

export interface Transaction {
	commit(): Promise<void>;
	rollback(): Promise<void>;
	afterCommit(fn: FnHook): void;
	afterRollback(fn: FnHook): void;
}
