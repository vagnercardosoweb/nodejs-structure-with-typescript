export type Code<T = unknown> = () => Promise<T>;

/** Executes code concurrently. */
export const go = (code: Code): void => {
  code().catch(() => {});
};

class Task<T = unknown> {
  public readonly resolve!: (data: T) => void;
  public readonly reject!: (error: any) => void;

  public readonly promise = new Promise<T>((resolve, reject) => {
    (this as any).resolve = resolve;
    (this as any).reject = reject;
  });

  constructor(public readonly code: Code<T>) {}
}

/** Limits concurrency of async code. */
export const concurrency = (limit: number) => {
  let workers = 0;
  const queue = new Set<Task>();

  const work = async () => {
    const task = queue.values().next().value;

    queue.delete(task);
    workers++;

    try {
      task.resolve(await task.code());
    } catch (error) {
      task.reject(error);
    } finally {
      workers--;
      if (queue.size) go(work);
    }
  };

  return async <T = unknown>(code: Code<T>): Promise<T> => {
    const task = new Task(code);
    queue.add(task as Task);
    if (workers < limit) go(work);
    return task.promise;
  };
};
