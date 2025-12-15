/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'START':
            if (self.timerId) clearInterval(self.timerId);
            self.timeLeft = payload.timeLeft;
            self.lastTick = Date.now();

            self.timerId = setInterval(() => {
                const now = Date.now();
                const delta = Math.floor((now - self.lastTick) / 1000);

                if (delta >= 1) {
                    self.timeLeft -= delta;
                    self.lastTick = now;

                    if (self.timeLeft <= 0) {
                        self.timeLeft = 0;
                        clearInterval(self.timerId);
                        self.postMessage({ type: 'COMPLETE' });
                    } else {
                        self.postMessage({ type: 'TICK', timeLeft: self.timeLeft });
                    }
                }
            }, 1000);
            break;

        case 'PAUSE':
        case 'STOP':
            if (self.timerId) clearInterval(self.timerId);
            break;

        case 'UPDATE_TIME':
            // Allows syncing valid time if needed without starting
            self.timeLeft = payload.timeLeft;
            break;
    }
};
