export class Clock {

    delay: number = 1000;

    private timestamp: number = Date.now();

    public async waitFor() {
        let now = Date.now();
        let withDelay = this.timestamp + this.delay;
        if (now > withDelay) {
            let diff = now - withDelay;
            await this.sleep(diff);
        }
        this.timestamp = Date.now();
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}