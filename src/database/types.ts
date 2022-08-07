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
