import { getDataFromSF } from 'data/sfConn';
import { updateDataIntoSF } from 'data/sfConn';

export class getDataFromSFWire {
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

export class updateDataFromSFWire {
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
            console.log('Config:', config);
            updateDataIntoSF(config && config.records.length > 0)
                .then((resp) => this.dataCallback({ data: resp }))
                .catch((err) => this.dataCallback({ error: err }));
        }
    }
}
