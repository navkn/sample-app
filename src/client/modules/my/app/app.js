import { LightningElement, wire } from 'lwc';
// eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
import getAccountRecords from 'data/sfWire';
const columns = [
    { label: 'SolarBot Status Name', fieldName: 'Name' },
    { label: 'SolarBot Name', fieldName: 'SolarBotName' },
    { label: 'Account Name', fieldName: 'SolarBotAccountName' }
];
export default class App extends LightningElement {
    result;
    columns = columns;
    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(getAccountRecords) getRecords({ data, error }) {
        console.log('Fetching the records');
        if (data) {
            console.log('got data', data);
            let records = data.records;
            records.forEach((rec) => {
                rec.SolarBotName = rec.SolarBot__r.Name;
                rec.SolarBotAccountName = rec.SolarBot__r.Account__r.Name;
            });
            this.result = records;
        }
        if (error) {
            console.log('got error', error);
        }
    }
}
