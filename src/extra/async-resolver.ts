
export class AsyncResolver {
    private static tasks: Promise<any>[] = [];

    public static addTask(task: Promise<any>) {
        this.tasks.push(task);
    }

    public static async resolveAll(): Promise<void> {
        if (this.tasks.length > 0) {
            await Promise.all(this.tasks);
        }
    }
}