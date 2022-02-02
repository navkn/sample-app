import { getDataFromSF } from 'data/sfConn';

export default class getDataFromSFWire {
    dataCallback;
    connected = false;

    constructor(dataCallback) {
        this.dataCallback = dataCallback;
    }

    connect() {
        this.connected = true;
        this.dataCallback({});
    }

    disconnect() {
        this.connected = false;
    }

    update(config) {
        if (this.connected) {
            getDataFromSF(config && config.subRedditName)
                .then((resp) => this.dataCallback({ data: resp }))
                .catch((err) => this.dataCallback({ error: err }));
        }
    }
}
